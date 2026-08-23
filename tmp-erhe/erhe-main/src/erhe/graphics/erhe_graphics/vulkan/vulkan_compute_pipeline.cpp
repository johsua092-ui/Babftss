#include "erhe_graphics/vulkan/vulkan_compute_pipeline.hpp"
#include "erhe_graphics/vulkan/vulkan_bind_group_layout.hpp"
#include "erhe_graphics/vulkan/vulkan_device.hpp"
#include "erhe_graphics/vulkan/vulkan_shader_stages.hpp"
#include "erhe_graphics/device.hpp"
#include "erhe_graphics/shader_stages.hpp"
#include "erhe_verify/verify.hpp"

#include <fmt/format.h>

namespace erhe::graphics {

Compute_pipeline_impl::Compute_pipeline_impl(Device& device, const Compute_pipeline_data& data)
    : m_device_impl{device.get_impl()}
{
    Shader_stages* shader_stages = data.shader_stages;
    if (shader_stages == nullptr) {
        device.device_message(Message_severity::error,"Compute_pipeline_impl: shader_stages is nullptr");
        return;
    }
    if (!shader_stages->is_valid()) {
        device.device_message(Message_severity::error,fmt::format("Compute_pipeline_impl: shader_stages '{}' is not valid", shader_stages->name()));
        return;
    }

    Device_impl& device_impl = device.get_impl();
    VkDevice vk_device = device_impl.get_vulkan_device();

    const Shader_stages_impl& stages_impl = shader_stages->get_impl();
    VkShaderModule compute_module = stages_impl.get_compute_module();
    if (compute_module == VK_NULL_HANDLE) {
        device.device_message(Message_severity::error,fmt::format("Compute_pipeline_impl: compute module is VK_NULL_HANDLE for '{}'", shader_stages->name()));
        return;
    }

    const VkPipelineShaderStageCreateInfo shader_stage_info{
        .sType  = VK_STRUCTURE_TYPE_PIPELINE_SHADER_STAGE_CREATE_INFO,
        .pNext  = nullptr,
        .flags  = 0,
        .stage  = VK_SHADER_STAGE_COMPUTE_BIT,
        .module = compute_module,
        .pName  = "main",
        .pSpecializationInfo = nullptr
    };

    // Get pipeline layout from bind group layout (fall back to shader stages' layout)
    const Bind_group_layout* bind_group_layout = data.bind_group_layout;
    if (bind_group_layout == nullptr) {
        bind_group_layout = shader_stages->get_bind_group_layout();
    }
    VkPipelineLayout pipeline_layout = VK_NULL_HANDLE;
    if (bind_group_layout != nullptr) {
        pipeline_layout = bind_group_layout->get_impl().get_pipeline_layout();
    }
    if (pipeline_layout == VK_NULL_HANDLE) {
        device.device_message(Message_severity::error,fmt::format("Compute_pipeline_impl: no pipeline layout for '{}'", shader_stages->name()));
        return;
    }

    const VkComputePipelineCreateInfo pipeline_create_info{
        .sType  = VK_STRUCTURE_TYPE_COMPUTE_PIPELINE_CREATE_INFO,
        .pNext  = nullptr,
        .flags  = 0,
        .stage  = shader_stage_info,
        .layout = pipeline_layout,
        .basePipelineHandle = VK_NULL_HANDLE,
        .basePipelineIndex  = -1
    };

    VkResult result = vkCreateComputePipelines(
        vk_device,
        device_impl.get_pipeline_cache(),
        1,
        &pipeline_create_info,
        nullptr,
        &m_vk_pipeline
    );
    if (result != VK_SUCCESS) {
        device.device_message(Message_severity::error,
            fmt::format(
                "vkCreateComputePipelines() failed with {} for '{}'",
                static_cast<int32_t>(result), shader_stages->name()
            )
        );
        m_vk_pipeline = VK_NULL_HANDLE;
        return;
    }

    if (data.name != nullptr) {
        device_impl.set_debug_label(
            VK_OBJECT_TYPE_PIPELINE,
            reinterpret_cast<uint64_t>(m_vk_pipeline),
            fmt::format("Compute Pipeline {}", data.name).c_str()
        );
    }
}

Compute_pipeline_impl::~Compute_pipeline_impl() noexcept
{
    if (m_vk_pipeline != VK_NULL_HANDLE) {
        VkPipeline pipeline = m_vk_pipeline;
        m_vk_pipeline = VK_NULL_HANDLE;
        m_device_impl.add_completion_handler(
            [pipeline](Device_impl& device_impl) {
                vkDestroyPipeline(device_impl.get_vulkan_device(), pipeline, nullptr);
            }
        );
    }
}

auto Compute_pipeline_impl::get_vk_pipeline() const -> VkPipeline
{
    return m_vk_pipeline;
}

auto Compute_pipeline_impl::is_valid() const -> bool
{
    return m_vk_pipeline != VK_NULL_HANDLE;
}

} // namespace erhe::graphics
