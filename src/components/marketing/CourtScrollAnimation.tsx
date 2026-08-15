import { useEffect, useRef, useState } from "react";

/**
 * A tennis court seen from the umpire's point of view — standing at the side
 * of the net, mid-court. The lines draw themselves as the section scrolls,
 * and the ball crosses to the far side when you scroll down and comes back
 * when you scroll up.
 * Purely presentational.
 */
const CourtScrollAnimation = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [ballPos, setBallPos] = useState(0.5);
  const ballTarget = useRef(1);
  const lastScrollY = useRef(0);
  const rafBall = useRef(0);

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
      const y = window.scrollY;
      if (Math.abs(y - lastScrollY.current) > 2) {
        ballTarget.current = y > lastScrollY.current ? 1 : 0;
        lastScrollY.current = y;
      }
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    lastScrollY.current = window.scrollY;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduced]);

  // smooth the ball toward whichever side the scroll direction points at
  useEffect(() => {
    if (reduced) return;
    const tick = () => {
      setBallPos((prev) => {
        const next = prev + (ballTarget.current - prev) * 0.06;
        return Math.abs(ballTarget.current - next) < 0.001 ? ballTarget.current : next;
      });
      rafBall.current = requestAnimationFrame(tick);
    };
    rafBall.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafBall.current);
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

  // side-on rally: ball crosses the net left <-> right along the mid-depth line
  const t = reduced ? 0.5 : ballPos;
  const groundY = 268;
  const ballX = 200 + (440 - 200) * t;
  const arc = Math.sin(t * Math.PI);
  const ballY = groundY - 12 - arc * 96;
  const ballScale = 0.85 + arc * 0.35;

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

              {/* court surface — viewed from the side of the net */}
              <polygon
                points="190,150 450,150 600,380 40,380"
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
                {/* outer boundary: baselines left & right, sidelines near & far */}
                <path
                  d="M190 150 L450 150 L600 380 L40 380 Z"
                  {...draw(1400, outerT)}
                />
                {/* singles sidelines (running away from the viewer) */}
                <path d="M214 158 L92 372" {...draw(260, innerT)} />
                <path d="M426 158 L548 372" {...draw(260, innerT)} />
                {/* service lines, parallel to the net */}
                <path d="M250 150 L170 380" {...draw(250, innerT)} />
                <path d="M390 150 L470 380" {...draw(250, innerT)} />
                {/* centre service line */}
                <path d="M210 265 L430 265" {...draw(220, innerT)} />
                {/* centre marks on each baseline */}
                <path d="M190 265 L210 265" {...draw(20, innerT)} />
                <path d="M430 265 L450 265" {...draw(20, innerT)} />
              </g>

              {/* net — runs straight away from the viewer through court centre */}
              <g style={{ opacity: netT }}>
                {/* mesh: slight camera offset makes the net read as a thin band */}
                <polygon
                  points="320,380 338,150 338,122 320,312"
                  fill="hsl(var(--foreground))"
                  fillOpacity="0.07"
                />
                {/* tape along the top of the net */}
                <path
                  d="M320 312 L338 122"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  {...draw(200, netT)}
                />
                {/* posts + base line of the net */}
                <path
                  d="M320 380 L320 312 M338 150 L338 122 M320 380 L338 150"
                  stroke="hsl(var(--foreground))"
                  strokeOpacity="0.3"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                  {...draw(330, netT)}
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
