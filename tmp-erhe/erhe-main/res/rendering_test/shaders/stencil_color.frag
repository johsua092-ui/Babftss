// Minimal fragment shader for the stencil-test cell. Outputs a constant
// color set via the STENCIL_COLOR define passed in at compile time.

#ifndef STENCIL_COLOR
#define STENCIL_COLOR vec4(1.0, 0.0, 1.0, 1.0)
#endif

void main()
{
    out_color = STENCIL_COLOR;
}
