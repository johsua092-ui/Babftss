#pragma once

#include "erhe_graphics/bind_group_layout.hpp"
#include "erhe_graphics/shader_resource.hpp"
#include "erhe_utility/debug_label.hpp"

namespace erhe::graphics {

class Device;

class Bind_group_layout_impl
{
public:
    Bind_group_layout_impl(Device& device, const Bind_group_layout_create_info& create_info);
    ~Bind_group_layout_impl() noexcept = default;

    [[nodiscard]] auto get_debug_label           () const -> erhe::utility::Debug_label;
    [[nodiscard]] auto get_sampler_binding_offset() const -> uint32_t;
    [[nodiscard]] auto get_default_uniform_block () const -> const Shader_resource&;

private:
    erhe::utility::Debug_label m_debug_label;
    Shader_resource            m_default_uniform_block;
};

} // namespace erhe::graphics
