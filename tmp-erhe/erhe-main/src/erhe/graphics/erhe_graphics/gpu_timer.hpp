#pragma once

#include <cstdint>
#include <memory>
#include <vector>

namespace erhe::graphics {

class Command_buffer;
class Render_pass;
class Gpu_timer_impl;

// A GPU-side wall-clock timer. Bound at construction to a Render_pass and
// measures the time the GPU spends executing that pass. Begin/end timestamps
// are emitted automatically from Render_pass::start_render_pass /
// Render_pass::end_render_pass; the result becomes available via
// last_result() roughly one or two frames later.
//
// The bound Render_pass must outlive the Gpu_timer. When the Render_pass is
// destroyed, the Gpu_timer is unregistered from it (and any further render
// pass scopes will not produce timestamps).
class Gpu_timer final
{
public:
    Gpu_timer(Render_pass& render_pass, const char* label);
    ~Gpu_timer() noexcept;

    Gpu_timer     (const Gpu_timer&) = delete;
    auto operator=(const Gpu_timer&) = delete;
    Gpu_timer     (Gpu_timer&&)      = delete;
    auto operator=(Gpu_timer&&)      = delete;

    // Last completed measurement, in nanoseconds. May briefly read 0 before
    // the first frame's results are available.
    [[nodiscard]] auto last_result() -> uint64_t;
    [[nodiscard]] auto label      () const -> const char*;

    // Internal: invoked by Render_pass at start/end of the bound pass.
    // Not intended to be called directly by user code.
    void write_begin_timestamp(Command_buffer& command_buffer);
    void write_end_timestamp  (Command_buffer& command_buffer);

    // Internal: invoked by ~Render_pass when the bound pass is destroyed
    // before this timer. After this call the timer becomes inert
    // (write_begin_timestamp / write_end_timestamp do nothing).
    void on_render_pass_destroyed();

    // Snapshot of every live Gpu_timer in the process. Used by
    // Performance_window to discover plots automatically.
    [[nodiscard]] static auto all_gpu_timers() -> std::vector<Gpu_timer*>;

private:
    Render_pass*                    m_render_pass{nullptr};
    std::unique_ptr<Gpu_timer_impl> m_impl;
};

} // namespace erhe::graphics
