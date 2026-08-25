#pragma once

#include "erhe_graphics/render_pipeline.hpp"

namespace erhe::graphics {

class Device;

// OpenGL has no pipeline objects. The impl stores a reference to the create info
// and applies GL state via the state tracker when bound.
class Render_pipeline_impl
{
public:
    Render_pipeline_impl(Device& device, const Render_pipeline_create_info& create_info);
    ~Render_pipeline_impl() noexcept = default;

    [[nodiscard]] auto get_device() -> Device&;
    [[nodiscard]] auto is_valid  () const -> bool;

private:
    Device& m_device;
};

} // namespace erhe::graphics
