#pragma once

#include "erhe_graphics/compute_pipeline_state.hpp"

#include <vulkan/vulkan.h>

namespace erhe::graphics {

class Device;
class Device_impl;

class Compute_pipeline_impl
{
public:
    Compute_pipeline_impl(Device& device, const Compute_pipeline_data& data);
    ~Compute_pipeline_impl() noexcept;
    Compute_pipeline_impl(const Compute_pipeline_impl&) = delete;
    void operator=(const Compute_pipeline_impl&) = delete;

    [[nodiscard]] auto get_vk_pipeline() const -> VkPipeline;
    [[nodiscard]] auto is_valid       () const -> bool;

private:
    Device_impl& m_device_impl;
    VkPipeline   m_vk_pipeline{VK_NULL_HANDLE};
};

} // namespace erhe::graphics
