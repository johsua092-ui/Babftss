#pragma once

#include <volk.h>

#include <vector>

namespace erhe::graphics {

class Device_impl;

// Cross-session pool of reusable VkFence / VkSemaphore handles. Owned by
// Device_impl so the pool outlives any single Swapchain_impl and can be
// shared with paths (e.g. OpenXR-driven device submits) that do not engage
// the desktop window swapchain at all. Previously these pools lived on
// Swapchain_impl; Swapchain now delegates to this class via a reference
// obtained from Device_impl::get_sync_pool().
class Device_sync_pool final
{
public:
    explicit Device_sync_pool(Device_impl& device_impl);
    ~Device_sync_pool() noexcept;
    Device_sync_pool (const Device_sync_pool&) = delete;
    void operator=   (const Device_sync_pool&) = delete;
    Device_sync_pool (Device_sync_pool&&)      = delete;
    void operator=   (Device_sync_pool&&)      = delete;

    [[nodiscard]] auto get_semaphore() -> VkSemaphore;
    [[nodiscard]] auto get_fence    () -> VkFence;
    void recycle_semaphore(VkSemaphore semaphore);
    void recycle_fence    (VkFence fence);

private:
    Device_impl&             m_device_impl;
    VkDevice                 m_vulkan_device{VK_NULL_HANDLE};
    std::vector<VkSemaphore> m_semaphore_pool;
    std::vector<VkFence>     m_fence_pool;
    size_t                   m_semaphore_serial{0};
    size_t                   m_fence_serial    {0};
};

} // namespace erhe::graphics
