#include "erhe_graphics/null/null_bind_group_layout.hpp"

namespace erhe::graphics {

Bind_group_layout_impl::Bind_group_layout_impl(Device& device, const Bind_group_layout_create_info& create_info)
    : m_debug_label         {create_info.debug_label}
    , m_default_uniform_block{device}
{
    static_cast<void>(create_info);
}

auto Bind_group_layout_impl::get_debug_label() const -> erhe::utility::Debug_label
{
    return m_debug_label;
}

auto Bind_group_layout_impl::get_sampler_binding_offset() const -> uint32_t
{
    return 0;
}

auto Bind_group_layout_impl::get_default_uniform_block() const -> const Shader_resource&
{
    return m_default_uniform_block;
}

} // namespace erhe::graphics
