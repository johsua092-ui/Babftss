#pragma once

#include "erhe_graphics/render_pipeline.hpp"

namespace erhe::graphics {

class Device;

class Render_pipeline_impl
{
public:
    Render_pipeline_impl(Device& device, const Render_pipeline_create_info& create_info);
    ~Render_pipeline_impl() noexcept = default;

    [[nodiscard]] auto is_valid() const -> bool;
};

} // namespace erhe::graphics
