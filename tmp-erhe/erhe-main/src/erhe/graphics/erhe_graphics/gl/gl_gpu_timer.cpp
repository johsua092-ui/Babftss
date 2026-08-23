#include <fmt/core.h>
#include <fmt/ostream.h>

#include "erhe_gl/wrapper_functions.hpp"
#include "erhe_graphics/gl/gl_gpu_timer.hpp"
#include "erhe_graphics/gl/gl_device.hpp"
#include "erhe_graphics/gpu_timer.hpp"
#include "erhe_graphics/graphics_log.hpp"
#include "erhe_graphics/render_pass.hpp"
#include "erhe_verify/verify.hpp"

#include <algorithm>
#include <sstream>
#include <thread>

// Comment this out to disable timer queries.
#define ERHE_USE_TIME_QUERY 1

namespace gl {

extern std::shared_ptr<spdlog::logger> log_gl;

}

namespace erhe::graphics {

ERHE_PROFILE_MUTEX(std::mutex, Gpu_timer_impl::s_mutex);
std::vector<Gpu_timer_impl*>   Gpu_timer_impl::s_all_gpu_timers;
std::size_t                    Gpu_timer_impl::s_index{0};

void Gpu_timer_impl::on_thread_enter()
{
#if defined(ERHE_USE_TIME_QUERY)
    const std::lock_guard<ERHE_PROFILE_LOCKABLE_BASE(std::mutex)> lock{s_mutex};

    for (Gpu_timer_impl* gpu_timer : s_all_gpu_timers) {
        if (gpu_timer->m_owner_thread == std::thread::id{}) {
            gpu_timer->create();
        }
    }
#endif
}

void Gpu_timer_impl::on_thread_exit()
{
#if defined(ERHE_USE_TIME_QUERY)
    const std::lock_guard<ERHE_PROFILE_LOCKABLE_BASE(std::mutex)> lock{s_mutex};

    const std::thread::id this_thread_id = std::this_thread::get_id();
    for (Gpu_timer_impl* gpu_timer : s_all_gpu_timers) {
        if (gpu_timer->m_owner_thread == this_thread_id) {
            gpu_timer->reset();
        }
    }
#endif
}

Gpu_timer_impl::Gpu_timer_impl(Render_pass& render_pass, const char* label)
    : m_render_pass{&render_pass}
    , m_device     {&render_pass.get_device()}
    , m_label      {label}
{
#if defined(ERHE_USE_TIME_QUERY)
    const std::lock_guard<ERHE_PROFILE_LOCKABLE_BASE(std::mutex)> lock{s_mutex};
    s_all_gpu_timers.push_back(this);
    create();
#endif
}

Gpu_timer_impl::~Gpu_timer_impl() noexcept
{
#if defined(ERHE_USE_TIME_QUERY)
    const std::lock_guard<ERHE_PROFILE_LOCKABLE_BASE(std::mutex)> lock{s_mutex};
    s_all_gpu_timers.erase(
        std::remove(s_all_gpu_timers.begin(), s_all_gpu_timers.end(), this),
        s_all_gpu_timers.end()
    );
#endif
}

void Gpu_timer_impl::create()
{
#if defined(ERHE_USE_TIME_QUERY)
    for (Query& query : m_queries) {
        if (!query.query_object.has_value()) {
            query.query_object.emplace(
                m_device->get_impl().create_query(gl::Query_target::time_elapsed)
            );
        }
    }
    m_owner_thread = std::this_thread::get_id();
#endif
}

void Gpu_timer_impl::reset()
{
#if defined(ERHE_USE_TIME_QUERY)
    m_owner_thread = {};
    for (Query& query : m_queries) {
        query.query_object.reset();
        query.pending = false;
    }
#endif
}

void Gpu_timer_impl::write_begin_timestamp(Command_buffer& command_buffer)
{
    static_cast<void>(command_buffer);
#if defined(ERHE_USE_TIME_QUERY)
    const std::lock_guard<ERHE_PROFILE_LOCKABLE_BASE(std::mutex)> lock{s_mutex};

    if (m_owner_thread != std::this_thread::get_id()) {
        // Timer was created on a different thread; skip silently. The
        // editor's render thread is the only one expected to drive timers.
        return;
    }

    Query& query = m_queries[s_index % s_count];
    if (!query.query_object.has_value()) {
        return;
    }
    if (query.pending) {
        // Previous use of this slot has not been polled yet (frame index
        // wrapped before end_frame caught up). Skip this round to avoid
        // overlapping queries on the same query object.
        return;
    }
    gl::begin_query(gl::Query_target::time_elapsed, query.query_object.value().gl_name());
#endif
}

void Gpu_timer_impl::write_end_timestamp(Command_buffer& command_buffer)
{
    static_cast<void>(command_buffer);
#if defined(ERHE_USE_TIME_QUERY)
    const std::lock_guard<ERHE_PROFILE_LOCKABLE_BASE(std::mutex)> lock{s_mutex};

    if (m_owner_thread != std::this_thread::get_id()) {
        return;
    }

    Query& query = m_queries[s_index % s_count];
    if (!query.query_object.has_value()) {
        return;
    }
    if (query.pending) {
        return;
    }
    gl::end_query(gl::Query_target::time_elapsed);
    query.pending = true;
#endif
}

void Gpu_timer_impl::poll()
{
#if defined(ERHE_USE_TIME_QUERY)
    if (m_owner_thread != std::this_thread::get_id()) {
        return;
    }

    for (std::size_t i = 0; i < s_count; ++i) {
        Query& query = m_queries[i];
        if (!query.pending || !query.query_object.has_value()) {
            continue;
        }
        const GLuint name = query.query_object.value().gl_name();
        GLint result_available{};
        gl::get_query_object_iv(name, gl::Query_object_parameter_name::query_result_available, &result_available);
        if (result_available != 0) {
            GLuint64 time_value{};
            gl::get_query_object_ui_64v(name, gl::Query_object_parameter_name::query_result, &time_value);
            m_last_result = time_value;
            query.pending = false;
        }
    }
#endif
}

auto Gpu_timer_impl::last_result() -> uint64_t
{
    return m_last_result;
}

auto Gpu_timer_impl::label() const -> const char*
{
    return (m_label != nullptr) ? m_label : "(unnamed)";
}

void Gpu_timer_impl::end_frame()
{
#if defined(ERHE_USE_TIME_QUERY)
    const std::lock_guard<ERHE_PROFILE_LOCKABLE_BASE(std::mutex)> lock{s_mutex};

    const std::thread::id this_thread_id = std::this_thread::get_id();
    for (Gpu_timer_impl* timer : s_all_gpu_timers) {
        if (timer->m_owner_thread == this_thread_id) {
            timer->poll();
        }
    }
    ++s_index;
#endif
}

} // namespace erhe::graphics
