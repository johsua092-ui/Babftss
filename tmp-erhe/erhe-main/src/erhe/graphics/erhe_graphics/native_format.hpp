#pragma once

#include "erhe_dataformat/dataformat.hpp"

#include <cstdint>
#include <string>

namespace erhe::graphics {

// Convert a backend-native swapchain format code (as returned by
// xrEnumerateSwapchainFormats: VkFormat on the Vulkan backend, GL internal
// format on the OpenGL backend) to an erhe::dataformat::Format. Returns
// format_undefined if the native code does not map to any known erhe format.
[[nodiscard]] auto native_swapchain_format_to_dataformat(int64_t native_format) -> erhe::dataformat::Format;

// Convert an erhe::dataformat::Format to the backend-native swapchain format
// code expected by xrCreateSwapchain. Returns 0 if no mapping exists.
[[nodiscard]] auto dataformat_to_native_swapchain_format(erhe::dataformat::Format format) -> int64_t;

// Human-readable name for a native swapchain format code (the backend's own
// enum identifier, e.g. "VK_FORMAT_R8G8B8A8_SRGB" or "GL_SRGB8_ALPHA8").
// Useful for diagnostics that want to show both the native and the
// erhe::dataformat name side-by-side.
[[nodiscard]] auto native_swapchain_format_c_str(int64_t native_format) -> std::string;

} // namespace erhe::graphics
