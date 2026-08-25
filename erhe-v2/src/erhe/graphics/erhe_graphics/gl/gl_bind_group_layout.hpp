#pragma once

#include "erhe_graphics/bind_group_layout.hpp"
#include "erhe_graphics/shader_resource.hpp"
#include "erhe_utility/debug_label.hpp"

#include <cstdint>

namespace erhe::graphics {

class Device;

class Bind_group_layout_impl
{
public:
    Bind_group_layout_impl(Device& device, const Bind_group_layout_create_info& create_info);
    ~Bind_group_layout_impl() noexcept = default;

    [[nodiscard]] auto get_debug_label           () const -> erhe::utility::Debug_label;
    [[nodiscard]] auto get_sampler_binding_offset() const -> uint32_t;

    // The GL Texture_heap implicitly takes the texture units that are not
    // claimed by an explicit combined_image_sampler binding in this layout.
    // Dedicated samplers occupy units [0, texture_heap_base_unit); the heap's
    // material array spans [texture_heap_base_unit, texture_heap_base_unit +
    // texture_heap_unit_count). The base is computed at construction as
    // (max combined_image_sampler binding_point + 1), or 0 when the layout
    // has no combined_image_sampler bindings; the count fills the rest of
    // the device's max_per_stage_descriptor_samplers range.
    [[nodiscard]] auto get_texture_heap_base_unit () const -> uint32_t;
    [[nodiscard]] auto get_texture_heap_unit_count() const -> uint32_t;

    // Shader_resource containing the sampler uniform declarations for
    // every combined_image_sampler binding in create_info, plus the
    // implicit texture-heap s_texture on the GL sampler-array path.
    // Consumed by the shader preamble emitter and the GL <4.3 sampler
    // location fallback.
    [[nodiscard]] auto get_default_uniform_block () const -> const Shader_resource&;

private:
    erhe::utility::Debug_label m_debug_label;
    uint32_t                   m_texture_heap_base_unit {0};
    uint32_t                   m_texture_heap_unit_count{0};
    Shader_resource            m_default_uniform_block;
};

} // namespace erhe::graphics
