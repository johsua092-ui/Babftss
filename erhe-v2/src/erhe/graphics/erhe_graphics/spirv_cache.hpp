#pragma once

#include "erhe_graphics/enums.hpp"

#include <filesystem>
#include <string>
#include <vector>

namespace erhe::graphics {

class Spirv_cache
{
public:
    explicit Spirv_cache(const std::filesystem::path& cache_directory);

    [[nodiscard]] auto get(const std::string& source, Shader_type stage) const -> std::vector<unsigned int>;
    void               put(const std::string& source, Shader_type stage, const std::vector<unsigned int>& spirv);

private:
    [[nodiscard]] auto compute_hash(const std::string& source, Shader_type stage) const -> std::string;
    [[nodiscard]] auto cache_path  (const std::string& hash) const -> std::filesystem::path;

    std::filesystem::path m_cache_directory;
};

} // namespace erhe::graphics
