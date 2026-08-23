#include "xr/xr_perf_metric_plot.hpp"

#include "erhe_xr/xr_session.hpp"

#include <algorithm>

namespace editor {

Xr_perf_metric_plot::Xr_perf_metric_plot(const erhe::xr::Xr_perf_counter* counter, const std::size_t width)
    : m_counter{counter}
    , m_label  {(counter != nullptr) ? counter->display_name : std::string{"(null)"}}
{
    m_values.resize(width);

    // Tune the y-axis based on the counter's reported unit. The unit is
    // populated by xrQueryPerformanceMetricsCounterFB on the first
    // successful query; until then the defaults from the Plot base class
    // are used. We re-evaluate during sample() once a valid unit arrives.
    m_max_great       = 11.1f;          // ~90 Hz frame budget
    m_max_ok          = 13.9f;          // ~72 Hz frame budget
    m_scale_max       = 16.6f;
    m_scale_max_limit = 1.0f;
}

void Xr_perf_metric_plot::sample()
{
    if (m_counter == nullptr) {
        return;
    }
    const XrPerformanceMetricsCounterMETA& c = m_counter->last;
    float value = 0.0f;

    if ((c.counterFlags & XR_PERFORMANCE_METRICS_COUNTER_FLOAT_VALUE_VALID_BIT_META) != 0) {
        value = c.floatValue;
    } else if ((c.counterFlags & XR_PERFORMANCE_METRICS_COUNTER_UINT_VALUE_VALID_BIT_META) != 0) {
        value = static_cast<float>(c.uintValue);
    }

    // Adjust scale based on unit. Done lazily so the plot picks up the unit
    // as soon as the runtime starts populating the counter.
    switch (c.counterUnit) {
        case XR_PERFORMANCE_METRICS_COUNTER_UNIT_PERCENTAGE_META:
            m_scale_max_limit = 100.0f;
            m_max_great       = 60.0f;
            m_max_ok          = 80.0f;
            break;
        case XR_PERFORMANCE_METRICS_COUNTER_UNIT_MILLISECONDS_META:
            m_max_great       = 11.1f;
            m_max_ok          = 13.9f;
            m_scale_max_limit = 1.0f;
            break;
        case XR_PERFORMANCE_METRICS_COUNTER_UNIT_BYTES_META:
        case XR_PERFORMANCE_METRICS_COUNTER_UNIT_HERTZ_META:
        case XR_PERFORMANCE_METRICS_COUNTER_UNIT_GENERIC_META:
        default:
            // Let auto-scale handle it; defaults are fine.
            break;
    }

    m_values[m_offset % m_values.size()] = value;
    m_value_count = std::min(m_value_count + 1, m_values.size());
    m_offset++;
}

auto Xr_perf_metric_plot::label() const -> const char*
{
    return m_label.c_str();
}

auto Xr_perf_metric_plot::counter() const -> const erhe::xr::Xr_perf_counter*
{
    return m_counter;
}

} // namespace editor
