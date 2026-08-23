#pragma once

#include "erhe_gl/wrapper_enums.hpp"
#include "erhe_dataformat/dataformat.hpp"

#include <cstddef>
#include <functional>
#include <optional>
#include <string>

namespace gl_helpers {

[[nodiscard]] auto size_of_type       (gl::Draw_elements_type type) -> std::size_t;
[[nodiscard]] auto size_of_type       (gl::Vertex_attrib_type type) -> std::size_t;
[[nodiscard]] auto is_indexed         (gl::Buffer_target type) -> bool;
[[nodiscard]] auto is_compressed      (gl::Internal_format format) -> bool;
[[nodiscard]] auto is_integer         (gl::Internal_format format) -> bool;
[[nodiscard]] auto is_unsigned_integer(gl::Internal_format format) -> bool;
[[nodiscard]] auto has_color          (gl::Internal_format format) -> bool;
[[nodiscard]] auto has_alpha          (gl::Internal_format format) -> bool;
[[nodiscard]] auto has_depth          (gl::Internal_format format) -> bool;
[[nodiscard]] auto has_stencil        (gl::Internal_format format) -> bool;

[[nodiscard]] auto convert_to_gl_index_type(erhe::dataformat::Format format) -> std::optional<gl::Draw_elements_type>;
[[nodiscard]] auto convert_to_gl(erhe::dataformat::Format format) -> std::optional<gl::Internal_format>;
[[nodiscard]] auto convert_from_gl(gl::Internal_format format) -> erhe::dataformat::Format;

using Error_callback = std::function<void(const std::string& message)>;

void set_error_checking(bool enable);
void set_error_callback(Error_callback callback);
void check_error       ();
[[nodiscard]] auto peek_error    () -> unsigned int;
[[nodiscard]] auto format_gl_state() -> std::string;
void initialize_logging();

} // namespace gl_helpers

