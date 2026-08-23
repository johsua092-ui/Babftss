layout(location = 0) out vec2 v_texcoord;

void main()
{
    // Fullscreen triangle covering NDC [-1,1].
    // UV range comes from quad.uv_min / quad.uv_max so the application can
    // flip the V axis to match the active backend's texture origin.
    const vec4 positions[3] = vec4[3](
        vec4(-1.0, -1.0, 0.0, 1.0),
        vec4( 3.0, -1.0, 0.0, 1.0),
        vec4(-1.0,  3.0, 0.0, 1.0)
    );
    const vec2 texcoords[3] = vec2[3](
        vec2(0.0, 0.0),
        vec2(2.0, 0.0),
        vec2(0.0, 2.0)
    );
    gl_Position = positions[gl_VertexID];
    vec2 t = texcoords[gl_VertexID];
    v_texcoord = mix(quad.uv_min, quad.uv_max, t);
}
