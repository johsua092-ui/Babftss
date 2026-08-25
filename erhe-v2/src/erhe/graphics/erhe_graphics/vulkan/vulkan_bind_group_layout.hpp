#pragma once

#include "erhe_graphics/bind_group_layout.hpp"
#include "erhe_graphics/enums.hpp"
#include "erhe_graphics/shader_resource.hpp"
#include "erhe_utility/debug_label.hpp"

#include <volk.h>

#include <vector>

namespace erhe::graphics {

class Device;
class Device_impl;

class Bind_group_layout_impl
{
public:
    Bind_group_layout_impl(Device& device, const Bind_group_layout_create_info& create_info);
    ~Bind_group_layout_impl() noexcept;
    Bind_group_layout_impl(const Bind_group_layout_impl&) = delete;
    void operator=(const Bind_group_layout_impl&) = delete;
    Bind_group_layout_impl(Bind_group_layout_impl&&) = delete;
    void operator=(Bind_group_layout_impl&&) = delete;

    [[nodiscard]] auto get_debug_label           () const -> erhe::utility::Debug_label;
    [[nodiscard]] auto get_descriptor_set_layout () const -> VkDescriptorSetLayout;
    [[nodiscard]] auto get_pipeline_layout       () const -> VkPipelineLayout;
    [[nodiscard]] auto get_sampler_binding_offset() const -> uint32_t;
    [[nodiscard]] auto get_default_uniform_block () const -> const Shader_resource&;
    [[nodiscard]] auto has_sampler_bindings      () const -> bool;

    // Look up the user-supplied Sampler_aspect annotation for the given
    // user-facing combined_image_sampler binding_point. The lookup matches
    // the binding_point as it was originally declared in
    // Bind_group_layout_create_info::bindings, NOT the offset Vulkan binding.
    [[nodiscard]] auto get_sampler_aspect_for_binding(uint32_t user_binding_point) const -> Sampler_aspect;

    // Returns the offset Vulkan binding for the given user-facing
    // combined_image_sampler binding_point (i.e. user_binding_point +
    // sampler_binding_offset). Used by set_sampled_image() to translate the
    // user's binding into the actual descriptor binding to write.
    [[nodiscard]] auto get_vulkan_binding_for_sampler(uint32_t user_binding_point) const -> uint32_t;

    // True when the binding was declared with Bind_group_layout_binding::
    // immutable_sampler set, which makes its sampler pre-baked into the
    // descriptor set layout via pImmutableSamplers. Encoder code uses this
    // to write VK_NULL_HANDLE for the descriptor's sampler field, which is
    // ignored by the driver but required on MoltenVK so that
    // VUID-VkDescriptorImageInfo-mutableComparisonSamplers-04450 does not
    // trip on comparison samplers.
    [[nodiscard]] auto is_sampler_binding_immutable(uint32_t user_binding_point) const -> bool;

private:
    class Sampler_binding_info
    {
    public:
        uint32_t       user_binding_point{0};
        uint32_t       vk_binding_point  {0};
        Sampler_aspect aspect            {Sampler_aspect::color};
        bool           is_immutable      {false};
    };

    Device_impl&                      m_device_impl;
    VkDevice                          m_vulkan_device            {VK_NULL_HANDLE};
    VkDescriptorSetLayout             m_descriptor_set_layout    {VK_NULL_HANDLE};
    VkPipelineLayout                  m_pipeline_layout          {VK_NULL_HANDLE};
    uint32_t                          m_sampler_binding_offset   {0};
    bool                              m_has_sampler_bindings     {false};
    std::vector<Sampler_binding_info> m_sampler_bindings;
    erhe::utility::Debug_label        m_debug_label;
    Shader_resource                   m_default_uniform_block;
};

} // namespace erhe::graphics
