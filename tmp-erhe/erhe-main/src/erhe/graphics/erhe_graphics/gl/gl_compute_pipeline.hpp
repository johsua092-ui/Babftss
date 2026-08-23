#pragma once

#include "erhe_graphics/compute_pipeline_state.hpp"

namespace erhe::graphics {

class Device;

class Compute_pipeline_impl
{
public:
    Compute_pipeline_impl(Device& device, const Compute_pipeline_data& data);
    ~Compute_pipeline_impl() noexcept = default;

    [[nodiscard]] auto is_valid() const -> bool;
};

} // namespace erhe::graphics
