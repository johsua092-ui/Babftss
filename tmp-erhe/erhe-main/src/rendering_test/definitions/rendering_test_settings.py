from erhe_codegen import *

# Rendering test settings.
#
# The grid is described by cols x rows tiles plus a cells[] list that
# names the subtest each tile runs. Names are strings (recognized by
# Rendering_test::dispatch_subtest); an empty string or "empty" skips
# the tile.
#
# Recognized subtest names:
#   - "cube"                   forward phong cube only, no edge lines
#   - "cube_with_edge_lines"   forward phong cube plus wide edge lines, always
#                              rendered via content_wide_line_renderer; the
#                              test stays backend-agnostic and does not call
#                              a geometry-shader path directly.
#   - "cube_edge_lines_only"   just the cube's wide edge lines, no fill. Uses
#                              the non-stencil wide-line pipeline.
#   - "sphere_edge_lines_only" just the sphere's wide edge lines, no fill. Uses
#                              the same pipeline as cube_edge_lines_only so
#                              pairing them in a grid does not introduce any
#                              VkPipeline switch between the two draws.
#   - "rtt"                    off-screen render of the cube displayed as a textured quad
#   - "texture_heap_2"         multi-texture heap sampling (red + green)
#   - "texture_heap_3"         multi-texture heap sampling (red + green + blue)
#   - "separate_samplers_2"    separate-samplers test with 2 textures
#   - "separate_samplers_3"    separate-samplers test with 3 textures
#   - "msaa_depth"             visualizes a resolved MSAA depth attachment
#   - "stencil_polygon"        cube writes stencil=1, polygon-fill sphere tests !=1
#   - "stencil_wide_line"      cube writes stencil=1, compute wide-line tests !=1
#                              (this is the Mac/Vulkan regression reproducer)
#   - "cube_no_stencil"        draws the stencil cube with a pipeline whose
#                              only depth_stencil-distinctive attribute is
#                              stencil_test_enable=false. Minimal half of the
#                              VkPipeline-switch reproducer.
#   - "cube_stencil_test_ne_0" draws the stencil cube with a pipeline whose
#                              only depth_stencil-distinctive attribute is
#                              stencil_test_enable=true (function=not_equal,
#                              reference=0). With the swapchain stencil
#                              cleared to 0 the test fails everywhere so the
#                              cube should NOT appear. Minimal other half of
#                              the repro.
#   - "minimal_compute_A"      Compute shader emits one triangle into a ring-
#                              buffer SSBO; graphics pipeline A (depth_test=
#                              true, stencil_test=false, red) reads it back
#                              as a vertex buffer. Smallest VkPipeline-switch
#                              reproducer free of Content_wide_line_renderer.
#   - "minimal_compute_B"      Same compute output as minimal_compute_A but
#                              drawn with pipeline B (depth_test=false,
#                              stencil_test=true not_equal 1, green).
#                              Pairing A then B in a grid exercises a raw
#                              vkCmdBindPipeline switch across pipelines
#                              that differ only in depth_stencil state.
#   - "" or "empty"            render nothing in this tile

struct("Rendering_test_settings",
    version=1,
    short_desc="Rendering Test Settings",
    long_desc="Per-run settings for the rendering_test application.",
    developer=False,
    fields=[
        field(
            "cols",
            Int,
            added_in=1,
            default="2",
            short_desc="Grid columns",
            long_desc="Number of grid columns.",
            visible=True,
            developer=False
        ),
        field(
            "rows",
            Int,
            added_in=1,
            default="5",
            short_desc="Grid rows",
            long_desc="Number of grid rows.",
            visible=True,
            developer=False
        ),
        field(
            "cells",
            Vector(String),
            added_in=1,
            default="",
            short_desc="Cells",
            long_desc=(
                "Row-major list of subtest names, indexed as "
                "cells[row * cols + col]. Missing / empty strings skip "
                "the tile. See header comment for the set of recognized "
                "names."
            ),
            visible=True,
            developer=False
        ),
        field(
            "fullscreen_cell_col",
            Int,
            added_in=1,
            default="-1",
            short_desc="Fullscreen Cell Column",
            long_desc="When both fullscreen_cell_* are >= 0, the subtest at that grid slot is rendered at full window size and all other tiles are skipped.",
            visible=True,
            developer=False
        ),
        field(
            "fullscreen_cell_row",
            Int,
            added_in=1,
            default="-1",
            short_desc="Fullscreen Cell Row",
            long_desc="When both fullscreen_cell_* are >= 0, the subtest at that grid slot is rendered at full window size and all other tiles are skipped.",
            visible=True,
            developer=False
        ),
        field(
            "replicate_cell_col",
            Int,
            added_in=1,
            default="-1",
            short_desc="Replicate Cell Column",
            long_desc="When both replicate_cell_* are >= 0, the subtest at that grid slot is rendered into every grid tile. Mutually exclusive with fullscreen mode.",
            visible=True,
            developer=False
        ),
        field(
            "replicate_cell_row",
            Int,
            added_in=1,
            default="-1",
            short_desc="Replicate Cell Row",
            long_desc="When both replicate_cell_* are >= 0, the subtest at that grid slot is rendered into every grid tile. Mutually exclusive with fullscreen mode.",
            visible=True,
            developer=False
        ),
    ],
)
