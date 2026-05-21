import { motion } from 'framer-motion';

export default function VerifiedBadge({ size = 'md' }) {
  const dimensions = {
    sm: { outer: 16, checkStroke: 2.5 },
    md: { outer: 22, checkStroke: 2.2 },
  };
  const d = dimensions[size] || dimensions.md;

  return (
    <span
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: d.outer, height: d.outer }}
      title="Pana Verificado"
    >
      {/* SVG escudo relleno verde + shine + check blanco — todo en un solo SVG */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={d.outer}
        height={d.outer}
        className="relative z-0 drop-shadow-[0_0_4px_rgba(0,201,122,0.6)]"
      >
        {/* Definición del clip al shape del escudo */}
        <defs>
          <clipPath id={`shield-clip-${size}`}>
            <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" />
          </clipPath>
        </defs>

        {/* Escudo relleno verde */}
        <path
          d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"
          fill="#00C97A"
          stroke="none"
        />

        {/* Check blanco */}
        <polyline
          points="9 12 11 14 15 10"
          fill="none"
          stroke="white"
          strokeWidth={d.checkStroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Shine recortado al escudo */}
        <motion.rect
          x="-20"
          y="0"
          width="14"
          height="24"
          fill="url(#shine-gradient)"
          clipPath={`url(#shield-clip-${size})`}
          style={{ skewX: -10 }}
          initial={{ x: -20 }}
          animate={{ x: 44 }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatDelay: 3.5,
            ease: 'easeInOut'
          }}
        />

        {/* Gradiente del shine */}
        <defs>
          <linearGradient id="shine-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="50%" stopColor="white" stopOpacity="0.45" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}
