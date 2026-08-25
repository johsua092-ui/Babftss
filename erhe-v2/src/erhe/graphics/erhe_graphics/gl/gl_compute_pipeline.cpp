#include "erhe_graphics/gl/gl_compute_pipeline.hpp"

namespace erhe::graphics {

Compute_pipeline_impl::Compute_pipeline_impl(Device&, const Compute_pipeline_data&)
{
}

auto Compute_pipeline_impl::is_valid() const -> bool
{
    return true; // OpenGL has no compute pipeline objects
}

} // namespace erhe::graphics
