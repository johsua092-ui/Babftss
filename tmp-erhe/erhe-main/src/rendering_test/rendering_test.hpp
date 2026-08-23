#pragma once

#include <string_view>

namespace rendering_test {

// Loads settings from `config_path` (default: "config/rendering_test/settings.json")
// and runs the rendering-test application. Pass a different path on the
// command line to switch between layouts, e.g. to test subtest ordering
// without rebuilding.
void run_rendering_test(std::string_view config_path = "config/rendering_test/settings.json");

} // namespace rendering_test
