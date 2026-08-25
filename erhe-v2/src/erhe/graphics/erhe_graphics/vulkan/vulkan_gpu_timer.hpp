#pragma once

#include "volk.h"

#include <cstddef>
#include <cstdint>

namespace erhe::graphics {

class Command_buffer;
class Device_impl;
class Render_pass;

// Vulkan GPU timer backend. Each timer is allocated a slot (begin+end query
// pair, replicated per frame in flight) from the Device-owned VkQueryPool.
// vkCmdWriteTimestamp is recorded from write_begin_timestamp /
// write_end_timestamp at render-pass start/end. Results are read in
// Device_impl::wait_frame after the timeline-semaphore fence wait, then
// stored back here via store_last_result_ns.
class Gpu_timer_impl
{
public:
    Gpu_timer_impl(Render_pass& render_pass, const char* label);
    ~Gpu_timer_impl() noexcept;

    Gpu_timer_impl(const Gpu_timer_impl&) = delete;
    auto operator=(const Gpu_timer_impl&) = delete;
    Gpu_timer_impl(Gpu_timer_impl&&)      = delete;
    auto operator=(Gpu_timer_impl&&)      = delete;

    [[nodiscard]] auto last_result() -> uint64_t;
    [[nodiscard]] auto label      () const -> const char*;

    void write_begin_timestamp(Command_buffer& command_buffer);
    void write_end_timestamp  (Command_buffer& command_buffer);

    // Called from Device_impl::wait_frame after results are read from the
    // VkQueryPool slice for this timer's slot.
    void store_last_result_ns(uint64_t nanoseconds);

private:
    Render_pass* m_render_pass{nullptr};
    Device_impl* m_device_impl{nullptr};
    const char*  m_label      {nullptr};
    int          m_slot       {-1};
    uint64_t     m_last_result{0};
};

} // namespace erhe::graphics
