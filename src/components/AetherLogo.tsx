import { Link } from "react-router-dom";

interface AetherLogoProps {
  to?: string;
  className?: string;
}

// "AETHER." wordmark with a minimalist tennis racket underline and a small
// "TENNIS" label tucked to the right. Racket runs parallel to the baseline.
export default function AetherLogo({ to = "/", className = "text-2xl" }: AetherLogoProps) {
  return (
    <Link
      to={to}
      className={`group inline-flex flex-col leading-none ${className}`}
      aria-label="Aether Tennis home"
    >
      <span className="font-heading font-bold tracking-wide">
        AETHER<span className="text-primary">.</span>
      </span>
      <span className="mt-1 flex items-center gap-2">
        <Racket />
        <span className="font-heading text-[0.32em] font-medium tracking-[0.45em] text-muted-foreground uppercase">
          Tennis
        </span>
      </span>
    </Link>
  );
}

function Racket() {
  // Horizontal racket: handle on the left, oval head on the right with a single
  // crossed string. Stroke uses currentColor so it inherits text styling, with
  // the head highlighted in primary.
  return (
    <svg
      viewBox="0 0 120 16"
      aria-hidden="true"
      className="h-[0.4em] w-[5em] text-foreground"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      {/* handle + grip */}
      <line x1="2" y1="8" x2="46" y2="8" />
      <line x1="6" y1="5" x2="6" y2="11" strokeWidth="2" />
      <line x1="11" y1="5" x2="11" y2="11" strokeWidth="2" />
      <line x1="16" y1="5" x2="16" y2="11" strokeWidth="2" />
      {/* throat */}
      <line x1="46" y1="8" x2="54" y2="3" />
      <line x1="46" y1="8" x2="54" y2="13" />
      {/* head */}
      <ellipse cx="86" cy="8" rx="32" ry="7" stroke="hsl(var(--primary))" />
      {/* strings */}
      <line x1="86" y1="1.5" x2="86" y2="14.5" stroke="hsl(var(--primary))" strokeWidth="0.75" opacity="0.7" />
      <line x1="58" y1="8" x2="114" y2="8" stroke="hsl(var(--primary))" strokeWidth="0.75" opacity="0.7" />
    </svg>
  );
}