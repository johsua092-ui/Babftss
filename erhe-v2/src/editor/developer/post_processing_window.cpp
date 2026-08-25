#include "developer/post_processing_window.hpp"

#include "app_context.hpp"
#include "editor_log.hpp"

#include "rendergraph/post_processing.hpp"
#include "scene/viewport_scene_views.hpp"

#include "erhe_imgui/imgui_renderer.hpp"
#include "erhe_imgui/imgui_windows.hpp"
#include "erhe_graphics/device.hpp"
#include "erhe_graphics/texture.hpp"
#include "erhe_profile/profile.hpp"
#include "erhe_rendergraph/rendergraph_node.hpp"
#include "erhe_rendergraph/resource_routing.hpp"

#include <imgui/imgui.h>

#include <fmt/format.h>

namespace editor {

Post_processing_window::Post_processing_window(
    erhe::imgui::Imgui_renderer& imgui_renderer,
    erhe::imgui::Imgui_windows&  imgui_windows,
    App_context&                 app_context
)
    : Imgui_window{imgui_renderer, imgui_windows, "Post Processing", "post_processing", true}
    , m_context   {app_context}
{
}

void Post_processing_window::imgui()
{
    ERHE_PROFILE_FUNCTION();

    // log_frame->trace("Post_processing_window::imgui()");

    bool edited = false;
    const std::vector<std::shared_ptr<Post_processing_node>>& nodes = m_context.scene_views->get_post_processing_nodes();
    if (!nodes.empty()) {
        if (m_post_processing_node.expired()) {
            m_post_processing_node = nodes.front();
            m_selection = 0;
        }
        int last_index = static_cast<int>(nodes.size() - 1);
        edited = ImGui::SliderInt("Viewport", &m_selection, 0, last_index);
        if (edited && (m_selection >= 0) && (m_selection < nodes.size())) {
            m_post_processing_node = nodes.at(m_selection);
        }
    }

    std::shared_ptr<Post_processing_node> node = m_post_processing_node.lock();
    if (!node) {
        return;
    }

    ImGui::SliderFloat("Size", &m_size, 0.0f, 1.0f, "%.3f", ImGuiSliderFlags_NoRoundToFormat);
    if (ImGui::RadioButton("Nearest", !m_linear_filter)) { m_linear_filter = false; }
    if (ImGui::RadioButton("Linear", m_linear_filter)) { m_linear_filter = true; }

    auto& weights = node->weights;
    size_t level_count = node->level_widths.size();

    if (level_count == 0) {
        // update_size() has not populated the pyramid yet -- e.g. first frame
        // before the rendergraph has executed, or the input viewport texture
        // is not yet connected. Sliders that touch per-level weights would
        // index out of range; thumbnails would have nothing to display.
        ImGui::TextUnformatted("Post processing node is not yet sized.");
        return;
    }

    ImGui::DragInt("LowPass Count", &node->lowpass_count, 0.01f, 0, 8);

    ImGui::SliderFloat("I_max", &node->tonemap_luminance_max,  0.0f, 10.0f, "%.4f", ImGuiSliderFlags_NoRoundToFormat);
    if (ImGui::IsItemEdited()) edited = true;
    ImGui::SliderFloat("alpha", &node->tonemap_alpha,  0.0f, 1.0f, "%.4f", ImGuiSliderFlags_NoRoundToFormat);
    if (ImGui::IsItemEdited()) edited = true;

    static float c0 =  0.12f; //1.0 / 128.0f;
    static float c1 =  0.05f; //1.0 / 256.0f;
    static float c2 = -1.0f;  // -2.00f;
    static float c3 =  2.0f;  //  3.00f;
    ImGui::SliderFloat("c0", &c0,  0.0f, 1.0f, "%.4f", ImGuiSliderFlags_NoRoundToFormat);
    if (ImGui::IsItemEdited()) edited = true;
    ImGui::SliderFloat("c1", &c1,  0.0f, 1.0f, "%.4f", ImGuiSliderFlags_NoRoundToFormat);
    if (ImGui::IsItemEdited()) edited = true;
    ImGui::SliderFloat("c2", &c2, -4.0f, 4.0f, "%.4f", ImGuiSliderFlags_NoRoundToFormat);
    if (ImGui::IsItemEdited()) edited = true;
    ImGui::SliderFloat("c3", &c3,  0.0f, 4.0f, "%.4f", ImGuiSliderFlags_NoRoundToFormat);
    if (ImGui::IsItemEdited()) edited = true;
    if (edited) {
        weights[0] = c0;
        weights[1] = c0;
        float max_value = 0.0f;
        for (size_t i = 2, end = weights.size(); i < end; ++i) {
            float l = static_cast<float>(1 + level_count - i);
            float w = c3 * std::pow(l, c2);
            weights[i] = 1.0f - w;
            max_value = std::max(max_value, weights[i]);
        }
        float margin = max_value - 1.0f;
        for (size_t i = 2, end = weights.size(); i < end; ++i) {
            weights[i] = weights[i] - margin - c1;
        }
    }

    // Diagnostic header: surface state the user cannot otherwise see, so a
    // black viewport can be bisected visually against the thumbnails below.
    const std::shared_ptr<erhe::graphics::Texture> input_texture =
        node->get_consumer_input_texture(erhe::rendergraph::Rendergraph_node_key::viewport_texture);
    ImGui::Text(
        "level0: %d x %d   levels: %zu   downsample_textures: %zu   upsample_textures: %zu",
        node->level0_width, node->level0_height, level_count,
        node->downsample_textures.size(),
        node->upsample_textures.size()
    );
    if (input_texture) {
        ImGui::Text(
            "input: '%.*s'  %dx%d",
            static_cast<int>(input_texture->get_debug_label().size()),
            input_texture->get_debug_label().data(),
            input_texture->get_width(),
            input_texture->get_height()
        );
    } else {
        ImGui::TextUnformatted("input: <none>");
    }

    const int display_width  = static_cast<int>(m_size * static_cast<float>(node->level_widths [0]));
    const int display_height = static_cast<int>(m_size * static_cast<float>(node->level_heights[0]));
    const erhe::graphics::Filter filter = m_linear_filter
        ? erhe::graphics::Filter::linear
        : erhe::graphics::Filter::nearest;

    ImGui::PushStyleVar(ImGuiStyleVar_WindowPadding, ImVec2{0.0f, 0.0f});
    node->texture_references.clear();

    // Input thumbnail: what the forward renderer handed post-processing.
    if (input_texture && (input_texture->get_width() >= 1) && (input_texture->get_height() >= 1)) {
        m_context.imgui_renderer->image(
            erhe::imgui::Draw_texture_parameters{
                .texture_reference = input_texture,
                .width             = display_width,
                .height            = display_height,
                .uv0               = m_context.imgui_renderer->get_rtt_uv0(),
                .uv1               = m_context.imgui_renderer->get_rtt_uv1(),
                .filter            = filter,
                .debug_label       = erhe::utility::Debug_label{"post_processing input"}
            }
        );
        if (ImGui::IsItemHovered()) {
            ImGui::BeginTooltip();
            ImGui::Text(
                "input '%.*s' %dx%d",
                static_cast<int>(input_texture->get_debug_label().size()),
                input_texture->get_debug_label().data(),
                input_texture->get_width(),
                input_texture->get_height()
            );
            ImGui::EndTooltip();
        }
    }

    // Downsample row: one thumbnail per downsample_textures[k] (pyramid level k+1).
    for (size_t k = 0; k < node->downsample_textures.size(); ++k) {
        const std::shared_ptr<erhe::graphics::Texture>& t = node->downsample_textures[k];
        if (!t) {
            continue;
        }
        m_context.imgui_renderer->image(
            erhe::imgui::Draw_texture_parameters{
                .texture_reference = t,
                .width             = display_width,
                .height            = display_height,
                .uv0               = m_context.imgui_renderer->get_rtt_uv0(),
                .uv1               = m_context.imgui_renderer->get_rtt_uv1(),
                .filter            = filter,
                .debug_label       = erhe::utility::Debug_label{"post_processing downsample"}
            }
        );
        if (ImGui::IsItemHovered()) {
            ImGui::BeginTooltip();
            ImGui::Text(
                "downsample[%zu] (pyramid level %zu) %dx%d",
                k, k + 1, t->get_width(), t->get_height()
            );
            ImGui::EndTooltip();
        }
    }

    // Upsample row: one thumbnail per upsample_textures[k] (pyramid level k).
    // The final (smallest index printed last, largest size) is pyramid level 0
    // == the post-processed image that the viewport consumer samples.
    for (size_t k = node->upsample_textures.size(); k > 0; --k) {
        const size_t index = k - 1;
        const std::shared_ptr<erhe::graphics::Texture>& t = node->upsample_textures[index];
        if (!t) {
            continue;
        }
        m_context.imgui_renderer->image(
            erhe::imgui::Draw_texture_parameters{
                .texture_reference = t,
                .width             = display_width,
                .height            = display_height,
                .uv0               = m_context.imgui_renderer->get_rtt_uv0(),
                .uv1               = m_context.imgui_renderer->get_rtt_uv1(),
                .filter            = filter,
                .debug_label       = erhe::utility::Debug_label{"post_processing upsample"}
            }
        );
        if (ImGui::IsItemHovered()) {
            ImGui::BeginTooltip();
            ImGui::Text(
                "upsample[%zu] (pyramid level %zu) %dx%d",
                index, index, t->get_width(), t->get_height()
            );
            ImGui::EndTooltip();
        }
        // Per-level weight slider maps to upsample_source_levels entry that
        // writes this level. upsample_source_levels is ordered deepest->shallowest;
        // index maps to source_level = index + 1 (destination_level = index).
        const size_t source_level = index + 1;
        if (source_level < node->weights.size()) {
            ImGui::SameLine();
            ImGui::PushID(static_cast<int>(source_level));
            ImGui::SliderFloat("##Post_processing_window::imgui()", &node->weights[source_level], 0.0f, 1.0f, "%.4f");
            if (ImGui::IsItemEdited()) edited = true;
            ImGui::PopID();
        }
    }
    ImGui::PopStyleVar();

    if (edited) {
        node->update_parameters();
    }
}

}
