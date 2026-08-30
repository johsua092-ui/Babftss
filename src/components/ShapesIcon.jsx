// Custom icon: triangle + cube (3D) + ball (with highlight dot)
// Designed to match the lucide-react visual style (stroke-based, rounded caps)
export default function ShapesIcon({ size = 22, color = '#2dd4bf' }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
        >
            {/* Triangle (left) */}
            <polygon points="2,17 6.5,9 11,17" />

            {/* Cube (middle, isometric 3D look) */}
            {/* Top face */}
            <path d="M12 12 L16.5 10 L21 12 L16.5 14 Z" />
            {/* Left face */}
            <path d="M12 12 L12 17.5 L16.5 19.5 L16.5 14" />
            {/* Right face */}
            <path d="M21 12 L21 17.5 L16.5 19.5 L16.5 14" />

            {/* Ball (top-right) with highlight dot for 3D feel */}
            <circle cx="20" cy="6" r="3" />
            <circle cx="19.1" cy="5.1" r="0.65" fill={color} stroke="none" opacity="0.85" />
        </svg>
    );
}
