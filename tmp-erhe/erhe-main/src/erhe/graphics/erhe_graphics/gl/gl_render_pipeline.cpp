#include "erhe_graphics/gl/gl_render_pipeline.hpp"

namespace erhe::graphics {

Render_pipeline_impl::Render_pipeline_impl(Device& device, const Render_pipeline_create_info&)
    : m_device{device}
{
}

auto Render_pipeline_impl::get_device() -> Device&
{
    return m_device;
}

auto Render_pipeline_impl::is_valid() const -> bool
{
    return true; // OpenGL has no pipeline objects that can fail to create
}

} // namespace erhe::graphics
