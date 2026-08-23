layout(location = 0) in vec2 v_texcoord;

void main()
{
#if defined(ERHE_TEXTURE_HEAP_OPENGL_BINDLESS)
    sampler2D s = sampler2D(quad.texture_handle);
    out_color = texture(s, v_texcoord);
#elif defined(ERHE_TEXTURE_HEAP_VULKAN_DESCRIPTOR_INDEXING)
    out_color = texture(erhe_texture_heap[quad.texture_handle.x], v_texcoord);
#else
    out_color = texture(s_textures[0], v_texcoord);
#endif
}
