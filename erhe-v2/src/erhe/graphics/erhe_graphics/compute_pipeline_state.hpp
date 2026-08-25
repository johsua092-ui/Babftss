#pragma once

#include "erhe_profile/profile.hpp"

#include <memory>
#include <mutex>
#include <vector>

namespace erhe::graphics {

class Bind_group_layout;
class Compute_pipeline_impl;
class Device;
class Shader_stages;

class Compute_pipeline_data
{
public:
    const char*              name             {nullptr};
    Shader_stages*           shader_stages    {nullptr};
    const Bind_group_layout* bind_group_layout{nullptr};
};

class Compute_pipeline
{
public:
    Compute_pipeline (Device& device, const Compute_pipeline_data& data);
    ~Compute_pipeline() noexcept;
    Compute_pipeline (const Compute_pipeline&) = delete;
    void operator=   (const Compute_pipeline&) = delete;
    Compute_pipeline (Compute_pipeline&& other) noexcept;
    auto operator=   (Compute_pipeline&& other) noexcept -> Compute_pipeline&;

    [[nodiscard]] auto get_impl() -> Compute_pipeline_impl&;
    [[nodiscard]] auto get_impl() const -> const Compute_pipeline_impl&;
    [[nodiscard]] auto is_valid() const -> bool;
    [[nodiscard]] auto get_data() const -> const Compute_pipeline_data&;

private:
    Compute_pipeline_data                  m_data;
    std::unique_ptr<Compute_pipeline_impl> m_impl;
};

class Compute_pipeline_state final
{
public:
    Compute_pipeline_state();
    Compute_pipeline_state(Compute_pipeline_data&& create_info);
    ~Compute_pipeline_state() noexcept;

    Compute_pipeline_state(const Compute_pipeline_state& other);
    auto operator=(const Compute_pipeline_state& other) -> Compute_pipeline_state&;
    Compute_pipeline_state(Compute_pipeline_state&& old) noexcept;
    auto operator=(Compute_pipeline_state&& old) noexcept -> Compute_pipeline_state&;

    void reset();

    Compute_pipeline_data data;

    static auto get_pipelines() -> std::vector<Compute_pipeline_state*>;

    static ERHE_PROFILE_MUTEX_DECLARATION(std::mutex, s_mutex);
    static std::vector<Compute_pipeline_state*>       s_pipelines;
};

} // namespace erhe::graphics
