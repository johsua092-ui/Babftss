layout(location = 0) out vec2 v_texcoord;

void main()
{
    //  Vertices of a fullscreen triangle:          .
    //                                              .
    //  gl_Position           v_texcoord            .
    //                                              .
    //   3  c                 2  c                  .
    //      |\                   |\                 .
    //   2  |  \                 |  \               .
    //      |    \               |    \             .
    //   1  +-----\           1  +-----\            .
    //      |     | \            |     | \          .
    //   0  |  +  |  \           |     |  \         .
    //      |     |    \         |     |    \       .
    //  -1  a-----+-----b     0  a-----+-----b      .
    //                                              .
    //     -1  0  1  2  3        0     1     2      .
    const vec4 positions[3] = vec4[3](
        vec4(-1.0, -1.0, 0.0, 1.0),
        vec4( 3.0, -1.0, 0.0, 1.0),
        vec4(-1.0,  3.0, 0.0, 1.0)
    );
#if defined(FRAMEBUFFER_TOP_LEFT)
    // Top-left framebuffer origin (Vulkan/Metal). Map gl_Position.y inversely
    // to texcoord.y so the visible viewport's top samples input row 0 (visual
    // top of source). Without this the natural raster mapping plus the
    // backend's Y handling produces an implicit V-flip in the output texture.
    const vec2 texcoords[3] = vec2[3](
        vec2(0.0,  1.0),
        vec2(2.0,  1.0),
        vec2(0.0, -1.0)
    );
#else
    // Bottom-left framebuffer origin (OpenGL). Identity mapping.
    const vec2 texcoords[3] = vec2[3](
        vec2(0.0, 0.0),
        vec2(2.0, 0.0),
        vec2(0.0, 2.0)
    );
#endif
    gl_Position = positions[gl_VertexID];
    v_texcoord  = texcoords[gl_VertexID];
}
