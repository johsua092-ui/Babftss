#include "programs.hpp"

#include "erhe_graphics/device.hpp"
#include "erhe_scene_renderer/program_interface.hpp"

namespace rendering_test {

Programs::Programs(erhe::graphics::Device& graphics_device, erhe::scene_renderer::Program_interface& program_interface)
    : nearest_sampler{
        graphics_device,
        erhe::graphics::Sampler_create_info{
            .min_filter  = erhe::graphics::Filter::nearest,
            .mag_filter  = erhe::graphics::Filter::nearest,
            .mipmap_mode = erhe::graphics::Sampler_mipmap_mode::nearest,
            .debug_label = "Programs nearest"
        }
    }
    , linear_sampler{
        graphics_device,
        erhe::graphics::Sampler_create_info{
            .min_filter  = erhe::graphics::Filter::linear,
            .mag_filter  = erhe::graphics::Filter::linear,
            .mipmap_mode = erhe::graphics::Sampler_mipmap_mode::nearest,
            .debug_label = "Programs linear"
        }
    }
    , linear_mipmap_linear_sampler{
        graphics_device,
        erhe::graphics::Sampler_create_info{
            .min_filter  = erhe::graphics::Filter::linear,
            .mag_filter  = erhe::graphics::Filter::linear,
            .mipmap_mode = erhe::graphics::Sampler_mipmap_mode::linear,
            .debug_label = "Programs linear mipmap"
        }
    }
    , standard{
        program_interface.make_program(
            erhe::graphics::build_shader_stages(
                program_interface.make_prototype(
                    erhe::graphics::Shader_stages_create_info{
                        .name              = "standard",
                        .dump_interface    = false,
                        .dump_final_source = false
                    }
                )
            )
        )
    }
{
}

} // namespace rendering_test
