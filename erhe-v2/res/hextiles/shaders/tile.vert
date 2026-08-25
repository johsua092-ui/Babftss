layout(location = 0) out vec2  v_texcoord;
layout(location = 1) out vec4  v_color;

#if defined(ERHE_TEXTURE_HEAP_OPENGL_BINDLESS)
layout(location = 2) flat out uvec2 v_texture;
#elif defined(ERHE_TEXTURE_HEAP_VULKAN_DESCRIPTOR_INDEXING)
layout(location = 2) flat out uint v_texture_index;
#elif defined(ERHE_TEXTURE_HEAP_OPENGL_SAMPLER_ARRAY)
layout(location = 2) flat out uint v_texture_index;
#elif defined(ERHE_TEXTURE_HEAP_METAL_ARGUMENT_BUFFER)
layout(location = 2) flat out uint v_texture_index;
#endif

void main()
{
    gl_Position = projection.clip_from_window * vec4(a_position, -0.5, 1.0);

#if defined(ERHE_TEXTURE_HEAP_OPENGL_BINDLESS)
    v_texture   = projection.texture;
#elif defined(ERHE_TEXTURE_HEAP_VULKAN_DESCRIPTOR_INDEXING)
    v_texture_index = projection.texture.x;
#elif defined(ERHE_TEXTURE_HEAP_OPENGL_SAMPLER_ARRAY)
    v_texture_index = projection.texture.x;
#elif defined(ERHE_TEXTURE_HEAP_METAL_ARGUMENT_BUFFER)
    v_texture_index = projection.texture.x;
#endif

    v_texcoord  = a_texcoord_0;
    v_color     = a_color_0;
}

