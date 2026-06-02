import { Link } from "react-router-dom";

interface AetherLogoProps {
  to?: string;
  className?: string;
}

// Tennis ball mark replacing the dot in "AETHER."
// Lime-yellow ball with curved seam, sized to sit on the typographic baseline.
export default function AetherLogo({ to = "/", className = "text-2xl" }: AetherLogoProps) {
  return (
    <Link
      to={to}
      className={`font-heading font-bold tracking-wide inline-flex items-baseline gap-1 ${className}`}
      aria-label="Aether Tennis home"
    >
      <span>AETHER</span>
      <TennisBall />
    </Link>
  );
}

function TennisBall() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="inline-block h-[0.7em] w-[0.7em] translate-y-[0.05em] drop-shadow-[0_0_8px_hsl(var(--primary)/0.55)]"
    >
      <circle cx="12" cy="12" r="11" fill="hsl(var(--primary))" />
      <path
        d="M2 9 C 8 11, 16 11, 22 9"
        fill="none"
        stroke="hsl(var(--background))"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M2 15 C 8 13, 16 13, 22 15"
        fill="none"
        stroke="hsl(var(--background))"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}