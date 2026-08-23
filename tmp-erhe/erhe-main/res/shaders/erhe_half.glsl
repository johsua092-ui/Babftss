#ifndef ERHE_HALF_GLSL
#define ERHE_HALF_GLSL


#if defined(ERHE_HAS_SHADER_FLOAT16)
#   define half        float16_t
#   define half_vec2   f16vec2
#   define half_vec3   f16vec3
#   define half_vec4   f16vec4
#   define half_mat2   f16mat2
#   define half_mat3   f16mat3
#   define half_mat4   f16mat4
#   define half_mat2x2 f16mat2x2
#   define half_mat2x3 f16mat2x3
#   define half_mat2x4 f16mat2x4
#   define half_mat3x2 f16mat3x2
#   define half_mat3x3 f16mat3x3
#   define half_mat3x4 f16mat3x4
#   define half_mat4x2 f16mat4x2
#   define half_mat4x3 f16mat4x3
#   define half_mat4x4 f16mat4x4
#else
#   define half        float
#   define half_vec2   vec2
#   define half_vec3   vec3
#   define half_vec4   vec4
#   define half_mat2   mat2
#   define half_mat3   mat3
#   define half_mat4   mat4
#   define half_mat2x2 mat2x2
#   define half_mat2x3 mat2x3
#   define half_mat2x4 mat2x4
#   define half_mat3x2 mat3x2
#   define half_mat3x3 mat3x3
#   define half_mat3x4 mat3x4
#   define half_mat4x2 mat4x2
#   define half_mat4x3 mat4x3
#   define half_mat4x4 mat4x4
#endif

#endif // ERHE_HALF_GLSL
