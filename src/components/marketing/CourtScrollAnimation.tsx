import { useEffect, useRef, useState } from "react";

/**
 * A tennis court in true one-point perspective, seen from the umpire's spot:
 * standing at the side of the net, looking straight across the court so the
 * baselines sit left and right. Lines draw themselves as the section scrolls,
 * and the ball's position along the court tracks the scroll position exactly.
 * Purely presentational.
 */

// --- world -> screen projection -------------------------------------------
// World: X = along the court (baseline to baseline), Z = across the court
// (away from the viewer), Y = height above the surface.
const CAM_DIST = 30; // metres from camera to court centre line
const CAM_H = 9; // camera height (exaggerated for readability)
const F = 618; // focal length in px
const CX = 320;
const HORIZON = 62;

type Pt = { x: number; y: number };

const project = (X: number, Z: number, Y = 0): Pt => {
  const d = Z + CAM_DIST;
  return { x: CX + (F * X) / d, y: HORIZON + (F * (CAM_H - Y)) / d };
};

const len = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);

// --- real court dimensions (metres) ---------------------------------------
const HALF_LEN = 11.885; // baseline to net
const HALF_DOUBLES = 5.485;
const HALF_SINGLES = 4.115;
const SERVICE = 6.4; // service line distance from net
const CENTER_MARK = 0.3;
const NET_POST = HALF_DOUBLES + 0.914;

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
      // 0 as the section enters from the bottom, 1 as it leaves past the top
      const raw = (vh - rect.top) / (vh + rect.height);
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

  const p = progress;
  // court + net are always fully drawn; only the ball reacts to scroll
  const netT = 1;
  const outerT = 1;
  const innerT = 1;

  // straight world line -> svg path + dash values for the draw-on effect
  const line = (
    x1: number,
    z1: number,
    x2: number,
    z2: number,
    t: number,
    y1 = 0,
    y2 = 0,
  ) => {
    const a = project(x1, z1, y1);
    const b = project(x2, z2, y2);
    const l = len(a, b);
    return {
      d: `M${a.x.toFixed(1)} ${a.y.toFixed(1)} L${b.x.toFixed(1)} ${b.y.toFixed(1)}`,
      strokeDasharray: l,
      strokeDashoffset: l * (1 - t),
    };
  };

  const poly = (pts: [number, number][]) =>
    pts
      .map(([x, z]) => {
        const q = project(x, z);
        return `${q.x.toFixed(1)},${q.y.toFixed(1)}`;
      })
      .join(" ");

  // --- ball: position along the court maps directly to scroll progress ------
  const u = reduced ? 0.5 : p;
  const ballX = -HALF_LEN * 0.92 + 2 * HALF_LEN * 0.92 * u;
  // one smooth arc over the net, apex at mid-court
  const ballY = 0.3 + Math.sin(Math.PI * u) * 3.6;
  const ball = project(ballX, 0, ballY);
  const shadow = project(ballX, 0, 0);
  const ballR = (F * 0.28) / CAM_DIST;

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
              viewBox="0 145 640 178"
              className="w-full"
              role="img"
              aria-label="Illustration of a tennis court seen from the side of the net"
            >
              <defs>
                <linearGradient id="courtFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.16" />
                </linearGradient>
                <radialGradient id="ballShine" cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="hsl(66 95% 72%)" />
                  <stop offset="100%" stopColor="hsl(70 80% 48%)" />
                </radialGradient>
              </defs>

              {/* playing surface (doubles court) */}
              <polygon
                points={poly([
                  [-HALF_LEN, HALF_DOUBLES],
                  [HALF_LEN, HALF_DOUBLES],
                  [HALF_LEN, -HALF_DOUBLES],
                  [-HALF_LEN, -HALF_DOUBLES],
                ])}
                fill="url(#courtFill)"
                style={{ opacity: outerT }}
              />

              <g
                fill="none"
                stroke="hsl(var(--foreground))"
                strokeOpacity="0.42"
                strokeWidth="1.6"
                strokeLinecap="butt"
              >
                {/* doubles sidelines (run left-right, near and far) */}
                <path {...line(-HALF_LEN, -HALF_DOUBLES, HALF_LEN, -HALF_DOUBLES, outerT)} />
                <path {...line(-HALF_LEN, HALF_DOUBLES, HALF_LEN, HALF_DOUBLES, outerT)} />
                {/* baselines (run away from the viewer) */}
                <path {...line(-HALF_LEN, -HALF_DOUBLES, -HALF_LEN, HALF_DOUBLES, outerT)} />
                <path {...line(HALF_LEN, -HALF_DOUBLES, HALF_LEN, HALF_DOUBLES, outerT)} />
                {/* singles sidelines */}
                <path {...line(-HALF_LEN, -HALF_SINGLES, HALF_LEN, -HALF_SINGLES, innerT)} />
                <path {...line(-HALF_LEN, HALF_SINGLES, HALF_LEN, HALF_SINGLES, innerT)} />
                {/* service lines */}
                <path {...line(-SERVICE, -HALF_SINGLES, -SERVICE, HALF_SINGLES, innerT)} />
                <path {...line(SERVICE, -HALF_SINGLES, SERVICE, HALF_SINGLES, innerT)} />
                {/* centre service line */}
                <path {...line(-SERVICE, 0, SERVICE, 0, innerT)} />
                {/* centre marks on both baselines */}
                <path {...line(HALF_LEN, 0, HALF_LEN - CENTER_MARK, 0, innerT)} />
                <path {...line(-HALF_LEN, 0, -HALF_LEN + CENTER_MARK, 0, innerT)} />
              </g>

              {/* net — spans the width of the court through X = 0 */}
              <g style={{ opacity: netT }}>
                <polygon
                  points={`${poly([[0, -NET_POST]])} ${poly([[0, NET_POST]])} ${[
                    project(0, NET_POST, 1.07),
                    project(0, 0, 0.914),
                    project(0, -NET_POST, 1.07),
                  ]
                    .map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`)
                    .join(" ")}`}
                  fill="hsl(var(--foreground))"
                  fillOpacity="0.14"
                />
                {/* mesh bands */}
                <g
                  stroke="hsl(var(--foreground))"
                  strokeOpacity="0.3"
                  strokeWidth="1.6"
                  fill="none"
                >
                  {[0.25, 0.5, 0.75].map((h) => {
                    const a = project(0, -NET_POST, 1.07 * h);
                    const m = project(0, 0, 0.914 * h);
                    const b = project(0, NET_POST, 1.07 * h);
                    return (
                      <path
                        key={h}
                        d={`M${a.x.toFixed(1)} ${a.y.toFixed(1)} Q${m.x.toFixed(1)} ${(
                          m.y + 2
                        ).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`}
                      />
                    );
                  })}
                </g>
                {/* tape along the top of the net, sagging to the centre strap */}
                {(() => {
                  const a = project(0, -NET_POST, 1.07);
                  const m = project(0, 0, 0.914);
                  const b = project(0, NET_POST, 1.07);
                  const l = len(a, m) + len(m, b);
                  return (
                    <path
                      d={`M${a.x.toFixed(1)} ${a.y.toFixed(1)} Q${m.x.toFixed(1)} ${(
                        m.y + 3
                      ).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`}
                      stroke="hsl(var(--primary))"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={l}
                      strokeDashoffset={l * (1 - netT)}
                    />
                  );
                })()}
                {/* posts */}
                <g
                  stroke="hsl(var(--foreground))"
                  strokeOpacity="0.5"
                  strokeWidth="3"
                  fill="none"
                >
                  <path {...line(0, -NET_POST, 0, -NET_POST, netT, 0, 1.07)} />
                  <path {...line(0, NET_POST, 0, NET_POST, netT, 0, 1.07)} />
                </g>
                <line
                  x1={project(0, -NET_POST).x}
                  y1={project(0, -NET_POST).y}
                  x2={project(0, -NET_POST, 1.07).x}
                  y2={project(0, -NET_POST, 1.07).y}
                  stroke="hsl(var(--foreground))"
                  strokeOpacity="0.5"
                  strokeWidth="3.5"
                />
                <line
                  x1={project(0, NET_POST).x}
                  y1={project(0, NET_POST).y}
                  x2={project(0, NET_POST, 1.07).x}
                  y2={project(0, NET_POST, 1.07).y}
                  stroke="hsl(var(--foreground))"
                  strokeOpacity="0.5"
                  strokeWidth="3.5"
                />
                {/* centre strap */}
                <line
                  x1={project(0, 0).x}
                  y1={project(0, 0).y}
                  x2={project(0, 0, 0.914).x}
                  y2={project(0, 0, 0.914).y}
                  stroke="hsl(var(--foreground))"
                  strokeOpacity="0.4"
                  strokeWidth="2"
                />
              </g>

              {/* ball */}
              <g style={{ opacity: outerT }}>
                <ellipse
                  cx={shadow.x}
                  cy={shadow.y}
                  rx={ballR * 1.3}
                  ry={ballR * 0.4}
                  fill="hsl(var(--foreground))"
                  opacity={0.16 - (ballY - 0.25) * 0.03}
                />
                <circle cx={ball.x} cy={ball.y} r={ballR} fill="url(#ballShine)" />
                <path
                  d={`M${(ball.x - ballR).toFixed(1)} ${ball.y.toFixed(1)} q${(
                    ballR * 0.9
                  ).toFixed(1)} ${(ballR * 0.85).toFixed(1)} ${(ballR * 2).toFixed(1)} 0`}
                  fill="none"
                  stroke="hsl(0 0% 100%)"
                  strokeOpacity="0.75"
                  strokeWidth="1"
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
