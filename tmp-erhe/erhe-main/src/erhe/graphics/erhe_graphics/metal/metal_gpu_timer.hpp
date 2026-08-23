#pragma once

#include <cstddef>
#include <cstdint>

namespace erhe::graphics {

class Command_buffer;
class Render_pass;

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

private:
    Render_pass* m_render_pass{nullptr};
    const char*  m_label      {nullptr};
};

} // namespace erhe::graphics
