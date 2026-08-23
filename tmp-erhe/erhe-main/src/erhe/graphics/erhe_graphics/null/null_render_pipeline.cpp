#include "erhe_graphics/null/null_render_pipeline.hpp"

namespace erhe::graphics {

Render_pipeline_impl::Render_pipeline_impl(Device&, const Render_pipeline_create_info&)
{
}

auto Render_pipeline_impl::is_valid() const -> bool
{
    return true;
}

} // namespace erhe::graphics
