import { useEffect, useMemo, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Scroll is the rally.
 *
 * A night-lit tennis court in one-point perspective, seen from a slightly
 * elevated position behind the near baseline. Everything the ball does —
 * position, height, bounce, rotation, scale, shadow — is a pure function of a
 * single normalised scroll progress value, so the whole sequence reverses
 * exactly when the user scrolls back up. Nothing animates on its own.
 */

// ---------------------------------------------------------------- geometry --
// World: X across the court, Z along the court (away from camera), Y height.
const HALF_LEN = 11.885; // baseline -> net
const HALF_DOUBLES = 5.485;
const HALF_SINGLES = 4.115;
const SERVICE = 6.4;
const CENTER_MARK = 0.3;
const NET_POST = HALF_DOUBLES + 0.914;
const NET_H_POST = 1.07;
const NET_H_MID = 0.914;

type Pt = { x: number; y: number };
type Cam = { dist: number; height: number; f: number; cx: number; horizon: number };

const DESKTOP_CAM: Cam = { dist: 26, height: 14, f: 700, cx: 320, horizon: 62 };
const MOBILE_CAM: Cam = { dist: 31, height: 20.5, f: 700, cx: 320, horizon: 62 };

const makeProject = (cam: Cam) => (X: number, Z: number, Y = 0): Pt => {
  const d = Z + cam.dist;
  return { x: cam.cx + (cam.f * X) / d, y: cam.horizon + (cam.f * (cam.height - Y)) / d };
};

const f1 = (n: number) => n.toFixed(1);

// ------------------------------------------------------------- trajectory --
// Keyframed height profile (metres) — interpolated with a smooth ease so the
// path reads as a plausible shot: rise, net crossing, descent, bounce, rise.
const HEIGHT_KEYS: [number, number][] = [
  [0.0, 0.22],
  [0.14, 1.75],
  [0.3, 3.25],
  [0.45, 2.35],
  [0.52, 1.75],
  [0.68, 0.62],
  [0.762, 0.055],
  [0.86, 1.0],
  [1.0, 0.3],
];

const smooth = (t: number) => t * t * (3 - 2 * t);

const heightAt = (u: number) => {
  for (let i = 0; i < HEIGHT_KEYS.length - 1; i++) {
    const [ua, ha] = HEIGHT_KEYS[i];
    const [ub, hb] = HEIGHT_KEYS[i + 1];
    if (u <= ub) {
      const t = ub === ua ? 0 : (u - ua) / (ub - ua);
      // ease out of the bounce a touch harder so contact feels sharp
      const e = i === 6 ? t * t : smooth(t);
      return ha + (hb - ha) * e;
    }
  }
  return HEIGHT_KEYS[HEIGHT_KEYS.length - 1][1];
};

const CourtScrollAnimation = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const isMobile = useIsMobile();

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // normalised scroll progress across the sticky section
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const travel = Math.max(1, rect.height - vh);
      const raw = -rect.top / travel;
      setProgress(Math.min(1, Math.max(0, raw)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // one short, subtle entrance when the court comes into view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setRevealed(true)),
      { rootMargin: "-10% 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // very restrained desktop pointer depth shift
  useEffect(() => {
    if (isMobile || reduced) return;
    const el = sectionRef.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      setPointer({
        x: Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2)),
        y: Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2)),
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [isMobile, reduced]);

  const cam = isMobile ? MOBILE_CAM : DESKTOP_CAM;
  const project = useMemo(() => makeProject(cam), [cam]);

  const line = (x1: number, z1: number, x2: number, z2: number, y1 = 0, y2 = 0) => {
    const a = project(x1, z1, y1);
    const b = project(x2, z2, y2);
    return `M${f1(a.x)} ${f1(a.y)} L${f1(b.x)} ${f1(b.y)}`;
  };

  const poly = (pts: [number, number][], y = 0) =>
    pts
      .map(([x, z]) => {
        const q = project(x, z, y);
        return `${f1(q.x)},${f1(q.y)}`;
      })
      .join(" ");

  const yNear = project(0, -HALF_LEN * 1.35, 0).y;
  const yFar = project(0, HALF_LEN * 1.3, 0).y;
  const viewBox = `0 ${f1(yFar - 74)} 640 ${f1(yNear - yFar + 96)}`;

  // ------------------------------------------------------------- the ball --
  const u = reduced ? 0.5 : progress;
  const travelZ = HALF_LEN * 0.94;
  const ballZ = -travelZ + 2 * travelZ * u;
  const ballY = reduced ? 1.4 : heightAt(u);
  const ball = project(0, ballZ, ballY);
  const ground = project(0, ballZ, 0);
  const depth = ballZ + cam.dist;
  const ballR = (cam.f * 0.115) / depth;

  // rotation follows distance travelled; reverses with scroll direction
  const spin = (u * 2 * travelZ * 360) / (2 * Math.PI * 0.0335) * 0.012;
  // contact compression only while the ball is at the surface
  const squash = 1 - Math.max(0, 1 - ballY / 0.34) * 0.16;

  const lift = Math.min(1, ballY / 3.3);
  const shadowRx = ballR * (1.15 + lift * 2.1);
  const shadowRy = ballR * (0.36 + lift * 0.5);
  const shadowOpacity = 0.5 - lift * 0.36;

  const px = isMobile || reduced ? 0 : pointer.x;
  const py = isMobile || reduced ? 0 : pointer.y;

  const netAfterBall = ballZ > 0; // ball on the far side sits behind the net

  const netNode = (
    <g>
      {/* net shadow cast onto the surface */}
      <polygon
        points={poly([
          [-NET_POST, 0],
          [NET_POST, 0],
          [NET_POST * 0.94, 1.5],
          [-NET_POST * 0.94, 1.5],
        ])}
        fill="hsl(150 30% 2%)"
        opacity="0.45"
      />
      {/* mesh */}
      <polygon
        points={`${poly([[-NET_POST, 0]])} ${poly([[NET_POST, 0]])} ${[
          project(NET_POST, 0, NET_H_POST),
          project(0, 0, NET_H_MID),
          project(-NET_POST, 0, NET_H_POST),
        ]
          .map((q) => `${f1(q.x)},${f1(q.y)}`)
          .join(" ")}`}
        fill="url(#netMesh)"
      />
      <g stroke="hsl(150 12% 78%)" strokeOpacity="0.18" strokeWidth="0.8" fill="none">
        {[0.2, 0.4, 0.6, 0.8].map((h) => {
          const a = project(-NET_POST, 0, NET_H_POST * h);
          const m = project(0, 0, NET_H_MID * h);
          const b = project(NET_POST, 0, NET_H_POST * h);
          return (
            <path key={h} d={`M${f1(a.x)} ${f1(a.y)} Q${f1(m.x)} ${f1(m.y + 1.5)} ${f1(b.x)} ${f1(b.y)}`} />
          );
        })}
      </g>
      {/* tape */}
      {(() => {
        const a = project(-NET_POST, 0, NET_H_POST);
        const m = project(0, 0, NET_H_MID);
        const b = project(NET_POST, 0, NET_H_POST);
        return (
          <path
            d={`M${f1(a.x)} ${f1(a.y)} Q${f1(m.x)} ${f1(m.y + 2)} ${f1(b.x)} ${f1(b.y)}`}
            stroke="hsl(150 14% 88%)"
            strokeOpacity="0.62"
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
          />
        );
      })()}
      {/* centre strap */}
      <path
        d={line(0, 0, 0, 0, 0, NET_H_MID)}
        stroke="hsl(150 14% 86%)"
        strokeOpacity="0.4"
        strokeWidth="1.6"
      />
      {/* posts */}
      <g stroke="hsl(150 8% 62%)" strokeOpacity="0.5" strokeWidth="2.6" strokeLinecap="round">
        <path d={line(-NET_POST, 0, -NET_POST, 0, 0, NET_H_POST)} />
        <path d={line(NET_POST, 0, NET_POST, 0, 0, NET_H_POST)} />
      </g>
    </g>
  );

  const ballNode = (
    <g>
      <ellipse
        cx={ground.x}
        cy={ground.y}
        rx={shadowRx}
        ry={shadowRy}
        fill="hsl(150 40% 2%)"
        opacity={shadowOpacity}
        filter={lift > 0.12 ? "url(#shadowSoft)" : undefined}
      />
      <g transform={`translate(${f1(ball.x)} ${f1(ball.y)})`}>
        <g transform={`scale(${(2 - squash).toFixed(3)} ${squash.toFixed(3)})`}>
          <circle r={ballR * 1.9} fill="url(#ballGlow)" opacity="0.5" />
          <circle r={ballR} fill="url(#ballBody)" />
          <g transform={`rotate(${spin.toFixed(2)})`} opacity="0.8">
            <path
              d={`M${f1(-ballR)} 0 q${f1(ballR * 0.95)} ${f1(ballR * 0.95)} ${f1(ballR * 2)} 0`}
              fill="none"
              stroke="hsl(60 40% 97%)"
              strokeOpacity="0.75"
              strokeWidth={Math.max(0.5, ballR * 0.13)}
            />
            <path
              d={`M${f1(-ballR)} 0 q${f1(ballR * 0.95)} ${f1(-ballR * 0.95)} ${f1(ballR * 2)} 0`}
              fill="none"
              stroke="hsl(60 40% 97%)"
              strokeOpacity="0.4"
              strokeWidth={Math.max(0.4, ballR * 0.1)}
            />
          </g>
          <ellipse
            cx={-ballR * 0.32}
            cy={-ballR * 0.38}
            rx={ballR * 0.34}
            ry={ballR * 0.24}
            fill="hsl(60 90% 96%)"
            opacity="0.5"
          />
        </g>
      </g>
    </g>
  );

  return (
    <section
      ref={sectionRef}
      className="relative border-b border-border"
      style={{ height: isMobile ? "180vh" : "230vh" }}
    >
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <div className="mb-6 max-w-xl sm:mb-8">
            <p className="text-eyebrow">On court</p>
            <h2 className="text-section mt-3">Scroll is the rally.</h2>
            <p className="text-body mt-3 max-w-md text-base">
              Aether keeps the admin off the court. Fixtures, captains and deadlines run in
              the background — you just show up and rally.
            </p>
          </div>

          <div
            className="relative overflow-hidden rounded-2xl"
            style={{
              background:
                "radial-gradient(120% 90% at 50% 42%, hsl(158 22% 11%) 0%, hsl(158 24% 6%) 48%, hsl(160 28% 3%) 100%)",
              boxShadow: "0 30px 70px -40px hsl(160 40% 6% / 0.8)",
              opacity: revealed || reduced ? 1 : 0,
              transition: "opacity 700ms cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <svg
              viewBox={viewBox}
              className="block w-full"
              role="img"
              aria-label="A night-lit tennis court seen in perspective, with a ball whose position follows the page scroll"
            >
              <defs>
                <linearGradient id="courtSurface" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(172 26% 15%)" />
                  <stop offset="55%" stopColor="hsl(170 24% 12%)" />
                  <stop offset="100%" stopColor="hsl(168 26% 9%)" />
                </linearGradient>
                <linearGradient id="apron" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(160 22% 7%)" />
                  <stop offset="100%" stopColor="hsl(160 24% 5%)" />
                </linearGradient>
                <radialGradient id="pool" cx="50%" cy="46%" r="55%">
                  <stop offset="0%" stopColor="hsl(90 40% 76%)" stopOpacity="0.16" />
                  <stop offset="60%" stopColor="hsl(120 30% 60%)" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="hsl(160 30% 10%)" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="netMesh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(150 10% 80%)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="hsl(150 10% 70%)" stopOpacity="0.08" />
                </linearGradient>
                <radialGradient id="ballBody" cx="34%" cy="30%" r="72%">
                  <stop offset="0%" stopColor="hsl(72 92% 74%)" />
                  <stop offset="55%" stopColor="hsl(78 78% 56%)" />
                  <stop offset="100%" stopColor="hsl(96 55% 30%)" />
                </radialGradient>
                <radialGradient id="ballGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="hsl(80 90% 62%)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="hsl(80 90% 62%)" stopOpacity="0" />
                </radialGradient>
                <filter id="shadowSoft" x="-80%" y="-200%" width="260%" height="500%">
                  <feGaussianBlur stdDeviation={Math.max(0.8, lift * 3.2)} />
                </filter>
                <filter id="grain" x="0" y="0" width="100%" height="100%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
                  <feColorMatrix type="saturate" values="0" />
                </filter>
                <linearGradient id="edgeFade" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(160 28% 3%)" stopOpacity="0.9" />
                  <stop offset="22%" stopColor="hsl(160 28% 3%)" stopOpacity="0" />
                  <stop offset="80%" stopColor="hsl(160 28% 3%)" stopOpacity="0" />
                  <stop offset="100%" stopColor="hsl(160 28% 3%)" stopOpacity="0.85" />
                </linearGradient>
              </defs>

              {/* environment: perimeter apron + faint fence */}
              <g transform={`translate(${(px * 1.2).toFixed(2)} ${(py * 0.8).toFixed(2)})`}>
                <polygon
                  points={poly([
                    [-HALF_DOUBLES - 5.4, -HALF_LEN - 5.5],
                    [HALF_DOUBLES + 5.4, -HALF_LEN - 5.5],
                    [HALF_DOUBLES + 5.4, HALF_LEN + 5.5],
                    [-HALF_DOUBLES - 5.4, HALF_LEN + 5.5],
                  ])}
                  fill="url(#apron)"
                />
                <g stroke="hsl(150 12% 60%)" strokeOpacity="0.09" strokeWidth="0.7" fill="none">
                  <path d={line(-HALF_DOUBLES - 5.4, HALF_LEN + 5.5, HALF_DOUBLES + 5.4, HALF_LEN + 5.5)} />
                  <path
                    d={line(
                      -HALF_DOUBLES - 5.4,
                      HALF_LEN + 5.5,
                      -HALF_DOUBLES - 5.4,
                      HALF_LEN + 5.5,
                      0,
                      3.6,
                    )}
                  />
                  <path
                    d={line(HALF_DOUBLES + 5.4, HALF_LEN + 5.5, HALF_DOUBLES + 5.4, HALF_LEN + 5.5, 0, 3.6)}
                  />
                  <path
                    d={line(
                      -HALF_DOUBLES - 5.4,
                      HALF_LEN + 5.5,
                      HALF_DOUBLES + 5.4,
                      HALF_LEN + 5.5,
                      3.6,
                      3.6,
                    )}
                  />
                </g>
              </g>

              {/* playing surface */}
              <g transform={`translate(${(px * 1.8).toFixed(2)} ${(py * 1.2).toFixed(2)})`}>
                <polygon
                  points={poly([
                    [-HALF_DOUBLES, -HALF_LEN],
                    [HALF_DOUBLES, -HALF_LEN],
                    [HALF_DOUBLES, HALF_LEN],
                    [-HALF_DOUBLES, HALF_LEN],
                  ])}
                  fill="url(#courtSurface)"
                />
                <polygon
                  points={poly([
                    [-HALF_DOUBLES, -HALF_LEN],
                    [HALF_DOUBLES, -HALF_LEN],
                    [HALF_DOUBLES, HALF_LEN],
                    [-HALF_DOUBLES, HALF_LEN],
                  ])}
                  fill="url(#pool)"
                />
                <polygon
                  points={poly([
                    [-HALF_DOUBLES, -HALF_LEN],
                    [HALF_DOUBLES, -HALF_LEN],
                    [HALF_DOUBLES, HALF_LEN],
                    [-HALF_DOUBLES, HALF_LEN],
                  ])}
                  filter="url(#grain)"
                  opacity="0.05"
                />

                {/* markings */}
                <g
                  fill="none"
                  stroke="hsl(80 18% 92%)"
                  strokeOpacity="0.5"
                  strokeWidth="1"
                  strokeLinecap="butt"
                >
                  <path d={line(-HALF_DOUBLES, -HALF_LEN, HALF_DOUBLES, -HALF_LEN)} />
                  <path d={line(-HALF_DOUBLES, HALF_LEN, HALF_DOUBLES, HALF_LEN)} />
                  <path d={line(-HALF_DOUBLES, -HALF_LEN, -HALF_DOUBLES, HALF_LEN)} />
                  <path d={line(HALF_DOUBLES, -HALF_LEN, HALF_DOUBLES, HALF_LEN)} />
                  <path d={line(-HALF_SINGLES, -HALF_LEN, -HALF_SINGLES, HALF_LEN)} />
                  <path d={line(HALF_SINGLES, -HALF_LEN, HALF_SINGLES, HALF_LEN)} />
                  <path d={line(-HALF_SINGLES, -SERVICE, HALF_SINGLES, -SERVICE)} />
                  <path d={line(-HALF_SINGLES, SERVICE, HALF_SINGLES, SERVICE)} />
                  <path d={line(0, -SERVICE, 0, SERVICE)} />
                  <path d={line(0, -HALF_LEN, 0, -HALF_LEN + CENTER_MARK)} />
                  <path d={line(0, HALF_LEN, 0, HALF_LEN - CENTER_MARK)} />
                </g>
              </g>

              {/* ball + net, layered by depth so the ball never passes through */}
              <g transform={`translate(${(px * 3).toFixed(2)} ${(py * 2).toFixed(2)})`}>
                {netAfterBall ? (
                  <>
                    {ballNode}
                    {netNode}
                  </>
                ) : (
                  <>
                    {netNode}
                    {ballNode}
                  </>
                )}
              </g>

              {/* atmospheric falloff */}
              <rect
                x="0"
                y={yFar - 74}
                width="640"
                height={yNear - yFar + 96}
                fill="url(#edgeFade)"
                pointerEvents="none"
              />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CourtScrollAnimation;
