#pragma once

#include "erhe_imgui/windows/performance_window.hpp"

#include <openxr/openxr.h>

#include <string>

namespace erhe::xr {
class Xr_perf_counter;
}

namespace editor {

// Plot one XR_FB_performance_metrics counter. Reads its cached float value
// from Xr_perf_counter::last each frame; values are refreshed once per tick
// by Xr_session::query_performance_metrics. Lifetime is owned by Headset_view;
// the bound Xr_perf_counter must outlive the plot.
class Xr_perf_metric_plot : public erhe::imgui::Plot
{
public:
    explicit Xr_perf_metric_plot(const erhe::xr::Xr_perf_counter* counter, std::size_t width = 256);

    void sample() override;
    [[nodiscard]] auto label() const -> const char* override;

    [[nodiscard]] auto counter() const -> const erhe::xr::Xr_perf_counter*;

private:
    const erhe::xr::Xr_perf_counter* m_counter{nullptr};
    // Stable label storage so the const char* returned by label() lives as
    // long as the plot.
    std::string                      m_label;
};

} // namespace editor
