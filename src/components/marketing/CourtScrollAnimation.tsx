import { useEffect, useRef, useState } from "react";

/**
 * A tennis court in perspective whose lines draw themselves as the section
 * scrolls through the viewport, with a ball rallying between baselines.
 * Purely presentational.
 */
const CourtScrollAnimation = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduced) {
      setProgress(1);
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // 0 when the section's top enters the viewport bottom, 1 once it is centered/past
      const raw = (vh - rect.top) / (vh * 0.75 + rect.height * 0.5);
      setProgress(Math.min(1, Math.max(0, raw)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduced]);

  const ease = (t: number) => 1 - Math.pow(1 - t, 3);
  const p = ease(progress);

  // staggered line reveal helper
  const seg = (start: number, end: number) =>
    Math.min(1, Math.max(0, (p - start) / (end - start)));

  const draw = (length: number, t: number) => ({
    strokeDasharray: length,
    strokeDashoffset: length * (1 - t),
  });

  const netT = seg(0, 0.25);
  const outerT = seg(0.1, 0.5);
  const innerT = seg(0.35, 0.75);
  const ballT = seg(0.55, 1);

  // rally arc: ball travels far baseline -> near baseline with a bounce
  const bx = 320;
  const byFar = 96;
  const byNear = 372;
  const cycle = (ballT * 2) % 2;
  const dir = cycle > 1 ? 2 - cycle : cycle;
  const ballY = byFar + (byNear - byFar) * dir;
  const ballX = bx + Math.sin(dir * Math.PI) * 92 * (cycle > 1 ? -1 : 1);
  const ballScale = 0.7 + 0.5 * dir;

  return (
    <section ref={sectionRef} className="border-b border-border py-16 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] lg:gap-16">
          <div>
            <p className="text-eyebrow">On court</p>
            <h2 className="text-section mt-4">
              The season lives where you already play.
            </h2>
            <p className="text-body mt-5 max-w-lg text-base">
              Aether keeps the admin off the court. Fixtures, captains and deadlines run
              in the background — you just show up and rally.
            </p>
          </div>

          <div className="relative">
            <svg
              viewBox="0 0 640 440"
              className="w-full"
              role="img"
              aria-label="Illustration of a tennis court"
            >
              <defs>
                <linearGradient id="courtFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.14" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.03" />
                </linearGradient>
              </defs>

              {/* court surface */}
              <polygon
                points="196,90 444,90 604,380 36,380"
                fill="url(#courtFill)"
                style={{ opacity: outerT }}
              />

              <g
                fill="none"
                stroke="hsl(var(--foreground))"
                strokeOpacity="0.45"
                strokeWidth="2"
                strokeLinecap="round"
              >
                {/* outer boundary */}
                <path
                  d="M196 90 L444 90 L604 380 L36 380 Z"
                  {...draw(1500, outerT)}
                />
                {/* singles sidelines */}
                <path d="M224 90 L516 380" {...draw(320, innerT)} />
                <path d="M416 90 L124 380" {...draw(320, innerT)} />
                {/* service line */}
                <path d="M170 235 L470 235" {...draw(300, innerT)} />
                {/* center service line */}
                <path d="M320 235 L320 90" {...draw(150, innerT)} />
                {/* far service line */}
                <path d="M243 160 L397 160" {...draw(160, innerT)} />
                {/* center marks */}
                <path d="M320 372 L320 380" {...draw(10, innerT)} />
              </g>

              {/* net */}
              <g style={{ opacity: netT }}>
                <path
                  d="M150 235 L490 235"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  {...draw(340, netT)}
                />
                <path
                  d="M150 235 L150 292 M490 235 L490 292 M150 292 L490 292"
                  stroke="hsl(var(--foreground))"
                  strokeOpacity="0.3"
                  strokeWidth="2"
                  fill="none"
                  {...draw(460, netT)}
                />
                <path
                  d="M180 238 L180 288 M215 240 L215 288 M250 241 L250 289 M285 242 L285 290 M320 243 L320 291 M355 242 L355 290 M390 241 L390 289 M425 240 L425 288 M460 238 L460 288"
                  stroke="hsl(var(--foreground))"
                  strokeOpacity="0.14"
                  strokeWidth="1.5"
                  fill="none"
                />
              </g>

              {/* ball */}
              <g style={{ opacity: ballT > 0 ? 1 : 0 }}>
                <ellipse
                  cx={ballX}
                  cy={ballY + 14}
                  rx={10 * ballScale}
                  ry={3 * ballScale}
                  fill="hsl(var(--foreground))"
                  opacity="0.12"
                />
                <circle
                  cx={ballX}
                  cy={ballY}
                  r={9 * ballScale}
                  fill="hsl(70 90% 55%)"
                  stroke="hsl(var(--foreground))"
                  strokeOpacity="0.18"
                />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CourtScrollAnimation;
