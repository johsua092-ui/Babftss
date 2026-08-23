#pragma once

#include <filesystem>
#include <string>
#include <vector>

namespace erhe::graphics {

class Device;

class Glsl_file_loader
{
public:
    explicit Glsl_file_loader(Device& device);

    [[nodiscard]] auto process_includes(std::size_t source_string_index, const std::string& source) -> std::string;
    [[nodiscard]] auto read_shader_source_file(
        const std::filesystem::path&                     path,
        const std::vector<std::filesystem::path>&        extra_include_paths = {}
    ) -> std::string;
    [[nodiscard]] auto get_file_paths() const -> const std::vector<std::filesystem::path>&;

private:
    Device&                            m_device;
    std::vector<std::filesystem::path> m_source_string_index_to_path;
    std::vector<std::filesystem::path> m_include_stack;
    std::vector<std::filesystem::path> m_extra_include_paths;
};

} // namespace erhe::graphics
