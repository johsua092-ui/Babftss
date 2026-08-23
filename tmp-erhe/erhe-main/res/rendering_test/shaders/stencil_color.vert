// Minimal vertex shader for the stencil-test cell. Position-only, output
// color is constant per draw via the STENCIL_COLOR define.

void main()
{
    mat4 world_from_node = primitive.primitives[ERHE_DRAW_ID].world_from_node;
    mat4 clip_from_world = camera.cameras[0].clip_from_world;
    gl_Position          = clip_from_world * world_from_node * vec4(a_position, 1.0);
}
