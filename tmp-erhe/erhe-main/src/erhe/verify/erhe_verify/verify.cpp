#include "erhe_verify/verify.hpp"

#include <cpptrace/cpptrace.hpp>
#include <cpptrace/formatting.hpp>
#include <cstdio>

#if defined(__ANDROID__)
#   include <android/log.h>
#   include <string>
#endif

namespace {

auto make_formatter() -> cpptrace::formatter
{
    cpptrace::formatter fmt;
    fmt.colors(cpptrace::formatter::color_mode::none);
    fmt.addresses(cpptrace::formatter::address_mode::none);
    return fmt;
}

} // anonymous namespace

void erhe_dump_callstack()
{
    static const cpptrace::formatter fmt = make_formatter();
#if defined(__ANDROID__)
    // stderr is /dev/null in Android app processes; route to logcat. Emit
    // line-by-line so each frame stays under the per-message size limit.
    __android_log_write(ANDROID_LOG_FATAL, "erhe", "=== Callstack ===");
    const std::string trace_str = fmt.format(cpptrace::generate_trace());
    std::size_t start = 0;
    while (start < trace_str.size()) {
        std::size_t end = trace_str.find('\n', start);
        if (end == std::string::npos) {
            end = trace_str.size();
        }
        if (end > start) {
            const std::string line = trace_str.substr(start, end - start);
            __android_log_write(ANDROID_LOG_FATAL, "erhe", line.c_str());
        }
        start = end + 1;
    }
    __android_log_write(ANDROID_LOG_FATAL, "erhe", "=================");
#else
    fprintf(stderr, "=== Callstack ===\n");
    fmt.print(stderr, cpptrace::generate_trace());
    fprintf(stderr, "=================\n");
#endif
}

auto erhe_get_callstack() -> std::string
{
    static const cpptrace::formatter fmt = make_formatter();
    return fmt.format(cpptrace::generate_trace());
}
