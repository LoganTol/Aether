import { Link } from "react-router-dom";

interface AetherLogoProps {
  to?: string;
  className?: string;
}

export default function AetherLogo({ to = "/", className = "text-4xl" }: AetherLogoProps) {
  return (
    <Link
      to={to}
      className={`group inline-flex flex-col leading-none pt-5 pb-4 ${className}`}
      aria-label="Aether Tennis home"
    >
      <span className="font-heading font-bold tracking-wide">
        AETHER<span className="text-primary">.</span>
      </span>
      <span className="font-heading -mt-1.5 text-[0.42em] font-medium tracking-[0.35em] text-muted-foreground uppercase">
        Tennis
      </span>
    </Link>
  );
}
