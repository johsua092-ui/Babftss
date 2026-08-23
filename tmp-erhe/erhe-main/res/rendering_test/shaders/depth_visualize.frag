layout(location = 0) in vec2 v_texcoord;

// Sample a single-sample depth texture (the resolved target of an MSAA depth
// resolve) and visualize it as grayscale. With reverse depth (1 = near,
// 0 = far) and a perspective projection of a small cube held close to the
// camera, the cube's depth values land in a narrow band right under 1.0 --
// raw `vec3(d)` would render as nearly-uniform white. We remap the visible
// range with a strong contrast curve so the gradient across the cube is
// actually perceptible:
//
//   - Background pixels (cleared, d == 0.0) render as black.
//   - Cube pixels render with the shape of the cube clearly visible.
//
// This is a diagnostic visualization, so the exact remap doesn't have to be
// physically meaningful -- it just has to be readable. We map d == 0 to 0,
// d == 1 to 1, and stretch the high-precision tail to span the full output
// range. `pow(d, 64)` is a cheap exponential that does this.
//
// s_depth is declared as a dedicated sampler in the depth_visualize shader's
// default uniform block (annotated with Sampler_aspect::depth), so on Vulkan
// it gets its own combined_image_sampler descriptor binding -- the texture
// heap's bindless array (set 1) is color-only and cannot bind a depth view.
void main()
{
    float d = texture(s_depth, v_texcoord).r;
    float v = pow(clamp(d, 0.0, 1.0), 64.0);
    out_color = vec4(v, v, v, 1.0);
}
