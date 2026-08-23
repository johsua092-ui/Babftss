// Minimal fragment shader for the "minimal compute-triangle" repro.
// Outputs a constant color selected at compile time via the
// MINIMAL_TRIANGLE_COLOR define.
//
// erhe emits the fragment output (out_color) from the
// Shader_stages_create_info::fragment_outputs array.

#ifndef MINIMAL_TRIANGLE_COLOR
#define MINIMAL_TRIANGLE_COLOR vec4(1.0, 0.0, 1.0, 1.0)
#endif

void main()
{
    // Mirrors the wide-line fragment shader structurally: include an
    // alpha-threshold discard statement. With MINIMAL_TRIANGLE_COLOR's
    // alpha fixed at 1.0 no fragments are discarded at runtime, but
    // the shader still statically has the discard, which changes the
    // pipeline's fragment-test stage wiring.
    float alpha = MINIMAL_TRIANGLE_COLOR.a;
    if (alpha < 0.5) {
        discard;
    }
    out_color = MINIMAL_TRIANGLE_COLOR;
}
