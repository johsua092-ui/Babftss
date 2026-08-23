// Minimal vertex shader for the "minimal compute-triangle" repro.
// Reads one vec4 position from the vertex buffer and emits it as the
// clip-space position. No UBOs, no SSBOs, no transforms.
//
// erhe's vertex_input machinery emits "layout(location = 0) in vec4
// a_position;" based on the Vertex_attribute_usage::position binding
// configured in cell_minimal_compute_triangle.cpp.

void main()
{
    gl_Position = a_position;

    // Static reference to the camera UBO so the pipeline statically
    // uses descriptor set 0 (same as Content_wide_line_renderer's
    // graphics shader). Multiplied by 0.0 so it doesn't affect the
    // output - this is purely to force the SPIR-V module to declare
    // and use the camera block binding.
    vec2 vp_xy = camera.cameras[0].viewport.xy;
    gl_Position.x += vp_xy.x * 0.0;
}
