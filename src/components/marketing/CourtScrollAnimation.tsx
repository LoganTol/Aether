import { useEffect, useMemo, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import ballAsset from "@/assets/tennis-ball.png.asset.json";

/**
 * Scroll is the rally — daylight edition.
 *
 * A courtside "line judge" view: the camera sits low, just outside the near
 * sideline, near the net, looking laterally across the court. The ball travels
 * left <-> right and every property (position, arc, bounce, spin, scale,
 * shadow) is a pure function of a single normalised scroll progress value, so
 * the sequence stops and reverses exactly with the user's scroll.
 *
 * World axes:  X = along the court (baseline -> baseline, screen left/right)
 *              Z = across the court (near sideline -> far sideline, depth)
 *              Y = height
 */

// ---------------------------------------------------------------- geometry --
const HALF_LEN = 11.885; // baseline -> net
const WIDTH_DOUBLES = 10.97;
const NEAR_SINGLES = 1.37;
const FAR_SINGLES = WIDTH_DOUBLES - 1.37;
const MID_Z = WIDTH_DOUBLES / 2;
const SERVICE = 6.4;
const CENTER_MARK = 0.3;
const NET_Z0 = -0.914;
const NET_Z1 = WIDTH_DOUBLES + 0.914;
const NET_H_POST = 1.07;
const NET_H_MID = 0.914;

type Pt = { x: number; y: number };
type Cam = {
  dist: number; // camera distance outside the near sideline
  camX: number; // lateral seat position along the court (0 = on the net axis)
  height: number; // eye height
  f: number;
  cx: number;
  horizon: number;
  rallyZ: number; // depth of the rally plane (the ball's lane)
  travel: number; // half of the ball's horizontal travel, in metres
  ballScale: number;
  vbW: number;
};

const seat = (c: Omit<Cam, "cx">): Cam => ({
  ...c,
  // centre the net midpoint in the frame; the net is the dominant visual
  // anchor, so the viewport should be balanced around it rather than the
  // ball's travel lane.
  cx: c.vbW / 2 + (c.f * c.camX) / (MID_Z + c.dist),
});

const DESKTOP_CAM: Cam = seat({
  dist: 6.0,
  camX: 0,
  height: 2.05,
  f: 520,
  horizon: 150,
  rallyZ: 2.3,
  travel: 6.9,
  ballScale: 0.24,
  vbW: 960,
});
const MOBILE_CAM: Cam = seat({
  dist: 7.0,
  camX: 0,
  height: 2.7,
  f: 520,
  horizon: 148,
  rallyZ: 2.8,
  travel: 4.4,
  ballScale: 0.3,
  vbW: 540,
});

const makeProject = (cam: Cam) => (X: number, Z: number, Y = 0): Pt => {
  const d = Z + cam.dist;
  return {
    x: cam.cx + (cam.f * (X - cam.camX)) / d,
    y: cam.horizon + (cam.f * (cam.height - Y)) / d,
  };
};

const f1 = (n: number) => n.toFixed(1);

// sunlight comes from the upper-left, behind the court -> shadows fall to the
// right and slightly toward the camera.
const SUN = { x: 0.82, z: -0.42 };

// ------------------------------------------------------------- trajectory --
const HEIGHT_KEYS: [number, number][] = [
  [0.0, 0.3],
  [0.12, 1.05],
  [0.3, 1.5],
  [0.5, 1.32],
  [0.62, 0.78],
  [0.73, 0.05],
  [0.86, 0.72],
  [1.0, 0.34],
];

const smooth = (t: number) => t * t * (3 - 2 * t);

const heightAt = (u: number) => {
  for (let i = 0; i < HEIGHT_KEYS.length - 1; i++) {
    const [ua, ha] = HEIGHT_KEYS[i];
    const [ub, hb] = HEIGHT_KEYS[i + 1];
    if (u <= ub) {
      const t = ub === ua ? 0 : (u - ua) / (ub - ua);
      const e = i === 4 ? t * t : i === 5 ? 1 - (1 - t) * (1 - t) : smooth(t);
      return ha + (hb - ha) * e;
    }
  }
  return HEIGHT_KEYS[HEIGHT_KEYS.length - 1][1];
};

const CourtScrollAnimation = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0.5);
  const [reduced, setReduced] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // normalised scroll progress: 0 as the scene enters from the bottom,
  // 1 as it leaves past the top. No sticky, no scroll takeover.
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const travel = vh + rect.height;
      const raw = (vh - rect.top) / travel;
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

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setRevealed(true)),
      { rootMargin: "-5% 0px -5% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const cam = isMobile ? MOBILE_CAM : DESKTOP_CAM;
  const project = useMemo(() => makeProject(cam), [cam]);

  const line = (x1: number, z1: number, x2: number, z2: number, y1 = 0, y2 = 0) => {
    const a = project(x1, z1, y1);
    const b = project(x2, z2, y2);
    return `M${f1(a.x)} ${f1(a.y)} L${f1(b.x)} ${f1(b.y)}`;
  };

  const poly = (pts: [number, number, number?][]) =>
    pts
      .map(([x, z, y]) => {
        const q = project(x, z, y ?? 0);
        return `${f1(q.x)},${f1(q.y)}`;
      })
      .join(" ");

  const vbW = cam.vbW;
  // centre the net horizontally in its section, not the vanishing point
  const netMid = project(0, MID_Z, 0);
  const vbX = netMid.x - vbW / 2;
  const vbTop = cam.horizon - (isMobile ? 108 : 96);
  const yFront = project(0, -cam.dist + 1.4, 0).y;
  const vbH = Math.min(yFront, cam.horizon + (isMobile ? 215 : 245)) - vbTop;
  const viewBox = `${f1(vbX)} ${f1(vbTop)} ${f1(vbW)} ${f1(vbH)}`;

  // ------------------------------------------------------------- the ball --
  const u = reduced ? 0.42 : progress;
  const ballX = -cam.travel + 2 * cam.travel * u;
  // gentle depth drift so the rally reads three-dimensional
  const ballZ = cam.rallyZ + Math.sin(u * Math.PI) * 1.3;
  const ballY = reduced ? 1.6 : heightAt(u);
  const ball = project(ballX, ballZ, ballY);
  const depth = ballZ + cam.dist;
  const ballR = (cam.f * cam.ballScale) / depth;

  // shadow lands where the sun projects the ball onto the surface
  const shadow = project(ballX + ballY * SUN.x, ballZ + ballY * SUN.z, 0);
  const shadowScale = (cam.f * cam.ballScale) / (ballZ + ballY * SUN.z + cam.dist);
  const lift = Math.min(1, ballY / 2.6);
  const shadowRx = shadowScale * (1.05 + lift * 1.5);
  const shadowRy = shadowScale * (0.34 + lift * 0.42);
  const shadowOpacity = 0.42 - lift * 0.26;

  const spin = u * 2 * cam.travel * 26;
  const squash = 1 - Math.max(0, 1 - ballY / 0.3) * 0.15;

  // sunlight sweeps almost imperceptibly with scroll
  const sunSweep = 34 + u * 22;

  const netNode = (
    <g>
      {/* net shadow on the surface */}
      <polygon
        points={poly([
          [0, NET_Z0],
          [0, NET_Z1],
          [NET_H_POST * SUN.x * 0.6, NET_Z1 + NET_H_POST * SUN.z * 0.6],
          [NET_H_POST * SUN.x * 0.6, NET_Z0 + NET_H_POST * SUN.z * 0.6],
        ])}
        fill="hsl(198 32% 26%)"
        opacity="0.14"
      />
      {/* mesh */}
      <polygon
        points={`${poly([
          [0, NET_Z0],
          [0, NET_Z1],
        ])} ${poly([
          [0, NET_Z1, NET_H_POST],
          [0, MID_Z, NET_H_MID],
          [0, NET_Z0, NET_H_POST],
        ])}`}
        fill="url(#netMesh)"
      />
      <g stroke="hsl(200 12% 30%)" strokeOpacity="0.3" strokeWidth="0.7" fill="none">
        {[0.22, 0.44, 0.66, 0.88].map((h) => {
          const a = project(0, NET_Z0, NET_H_POST * h);
          const m = project(0, MID_Z, NET_H_MID * h);
          const b = project(0, NET_Z1, NET_H_POST * h);
          return (
            <path
              key={h}
              d={`M${f1(a.x)} ${f1(a.y)} Q${f1(m.x)} ${f1(m.y + 1.2)} ${f1(b.x)} ${f1(b.y)}`}
            />
          );
        })}
        {Array.from({ length: 13 }, (_, i) => NET_Z0 + ((NET_Z1 - NET_Z0) * i) / 12).map((z) => {
          const t = Math.abs(z - MID_Z) / (NET_Z1 - MID_Z);
          const top = NET_H_MID + (NET_H_POST - NET_H_MID) * t * t;
          return <path key={z} d={line(0, z, 0, z, 0, top)} />;
        })}
      </g>
      {/* tape */}
      {(() => {
        const a = project(0, NET_Z0, NET_H_POST);
        const m = project(0, MID_Z, NET_H_MID);
        const b = project(0, NET_Z1, NET_H_POST);
        return (
          <path
            d={`M${f1(a.x)} ${f1(a.y)} Q${f1(m.x)} ${f1(m.y + 1.6)} ${f1(b.x)} ${f1(b.y)}`}
            stroke="hsl(0 0% 100%)"
            strokeOpacity="0.92"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        );
      })()}
      {/* centre strap */}
      <path d={line(0, MID_Z, 0, MID_Z, 0, NET_H_MID)} stroke="hsl(0 0% 98%)" strokeOpacity="0.8" strokeWidth="2" />
      {/* posts */}
      <g stroke="hsl(200 14% 34%)" strokeOpacity="0.9" strokeLinecap="round">
        <path d={line(0, NET_Z0, 0, NET_Z0, 0, NET_H_POST)} strokeWidth="5" />
        <path d={line(0, NET_Z1, 0, NET_Z1, 0, NET_H_POST)} strokeWidth="3.4" />
      </g>
    </g>
  );

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-y border-border"
      aria-label="A sunlit outdoor tennis court seen from courtside"
      style={{
        background: "linear-gradient(hsl(var(--background)) 0%, hsl(198 46% 92%) 38%, hsl(46 32% 92%) 100%)",
      }}
    >
      <div className="mx-auto w-full max-w-6xl px-5 pt-14 sm:px-8 sm:pt-20">
        <div className="max-w-xl">
          <h2 className="text-section">Keep the season in motion.</h2>
          <p className="text-body mt-3 max-w-md text-base">
            Aether coordinates schedules, results, standings, and shared responsibilities so the season never depends on one person to keep it going.
          </p>
        </div>
      </div>

      <div
        className="relative mt-8 sm:mt-12"
        style={{
          opacity: revealed || reduced ? 1 : 0,
          transition: "opacity 700ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <svg
          viewBox={viewBox}
          className="block w-full"
          preserveAspectRatio="xMidYMax slice"
          role="img"
          aria-label="A tennis ball crossing a sunlit court; its position follows the page scroll"
        >
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(218 58% 74%)" />
              <stop offset="32%" stopColor="hsl(282 46% 79%)" />
              <stop offset="58%" stopColor="hsl(14 82% 80%)" />
              <stop offset="80%" stopColor="hsl(26 94% 76%)" />
              <stop offset="100%" stopColor="hsl(40 98% 78%)" />
            </linearGradient>
            <linearGradient id="courtSurface" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(162 22% 46%)" />
              <stop offset="55%" stopColor="hsl(160 24% 41%)" />
              <stop offset="100%" stopColor="hsl(158 24% 36%)" />
            </linearGradient>
            <linearGradient id="apron" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(38 22% 78%)" />
              <stop offset="100%" stopColor="hsl(36 20% 70%)" />
            </linearGradient>
            <linearGradient id="trees" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(120 16% 55%)" />
              <stop offset="100%" stopColor="hsl(140 20% 38%)" />
            </linearGradient>
            <linearGradient id="sunWash" x1="0" y1="0" x2="1" y2="0.4">
              <stop offset="0%" stopColor="hsl(28 94% 70%)" stopOpacity="0.40" />
              <stop offset={`${sunSweep}%`} stopColor="hsl(40 92% 78%)" stopOpacity="0.20" />
              <stop offset="100%" stopColor="hsl(268 38% 58%)" stopOpacity="0.16" />
            </linearGradient>
            <linearGradient id="netMesh" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(200 10% 24%)" stopOpacity="0.42" />
              <stop offset="100%" stopColor="hsl(200 10% 20%)" stopOpacity="0.24" />
            </linearGradient>
            <radialGradient id="ballBody" cx="34%" cy="30%" r="78%">
              <stop offset="0%" stopColor="hsl(66 98% 82%)" />
              <stop offset="42%" stopColor="hsl(70 88% 64%)" />
              <stop offset="78%" stopColor="hsl(80 62% 44%)" />
              <stop offset="100%" stopColor="hsl(96 44% 27%)" />
            </radialGradient>
            <radialGradient id="ballWarm" cx="26%" cy="22%" r="60%">
              <stop offset="0%" stopColor="hsl(38 100% 88%)" stopOpacity="0.55" />
              <stop offset="100%" stopColor="hsl(38 100% 80%)" stopOpacity="0" />
            </radialGradient>
            <clipPath id="ballClip">
              <circle r={ballR} />
            </clipPath>
            <filter id="shadowSoft" x="-120%" y="-300%" width="340%" height="700%">
              <feGaussianBlur stdDeviation={Math.max(0.6, lift * 2.6)} />
            </filter>
            <filter id="farSoft" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="1.6" />
            </filter>
            <filter id="grain" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
          </defs>

          {/* sky */}
          <rect x={vbX} y={vbTop} width={vbW} height={cam.horizon - vbTop + 26} fill="url(#sky)" />

          {/* distant greenery + facility hints */}
          <g filter="url(#farSoft)">
            <path
              d={`M${vbX} ${cam.horizon + 6} Q${vbX + vbW * 0.18} ${cam.horizon - 34} ${vbX + vbW * 0.36} ${cam.horizon - 4}
                  Q${vbX + vbW * 0.52} ${cam.horizon - 40} ${vbX + vbW * 0.7} ${cam.horizon - 8}
                  Q${vbX + vbW * 0.86} ${cam.horizon - 30} ${vbX + vbW} ${cam.horizon + 2}
                  L${vbX + vbW} ${cam.horizon + 22} L${vbX} ${cam.horizon + 22} Z`}
              fill="url(#trees)"
              opacity="0.85"
            />
            <rect
              x={vbX + vbW * 0.06}
              y={cam.horizon - 12}
              width={vbW * 0.14}
              height={18}
              fill="hsl(40 18% 82%)"
              opacity="0.7"
            />
          </g>

          {/* far fence */}
          <g stroke="hsl(190 12% 46%)" strokeOpacity="0.32" fill="none">
            {(() => {
              const zFence = WIDTH_DOUBLES + 5.2;
              const top = 3.4;
              return (
                <>
                  <rect
                    x={project(-40, zFence, top).x}
                    y={project(0, zFence, top).y}
                    width={project(40, zFence, top).x - project(-40, zFence, top).x}
                    height={project(0, zFence, 0).y - project(0, zFence, top).y}
                    fill="hsl(196 16% 70%)"
                    fillOpacity="0.16"
                    stroke="none"
                  />
                  <path d={line(-40, zFence, 40, zFence, top, top)} strokeWidth="1.2" />
                  {Array.from({ length: 15 }, (_, i) => -35 + i * 5).map((x) => (
                    <path key={x} d={line(x, zFence, x, zFence, 0, top)} strokeWidth="0.7" strokeOpacity="0.2" />
                  ))}
                </>
              );
            })()}
          </g>

          {/* perimeter apron */}
          <polygon
            points={poly([
              [-40, -cam.dist + 0.6],
              [40, -cam.dist + 0.6],
              [40, WIDTH_DOUBLES + 5.2],
              [-40, WIDTH_DOUBLES + 5.2],
            ])}
            fill="url(#apron)"
          />

          {/* playing surface */}
          <polygon
            points={poly([
              [-HALF_LEN, 0],
              [HALF_LEN, 0],
              [HALF_LEN, WIDTH_DOUBLES],
              [-HALF_LEN, WIDTH_DOUBLES],
            ])}
            fill="url(#courtSurface)"
          />
          <polygon
            points={poly([
              [-HALF_LEN, 0],
              [HALF_LEN, 0],
              [HALF_LEN, WIDTH_DOUBLES],
              [-HALF_LEN, WIDTH_DOUBLES],
            ])}
            fill="url(#sunWash)"
          />
          <polygon
            points={poly([
              [-HALF_LEN - 6, -5],
              [HALF_LEN + 6, -5],
              [HALF_LEN + 6, WIDTH_DOUBLES + 5],
              [-HALF_LEN - 6, WIDTH_DOUBLES + 5],
            ])}
            filter="url(#grain)"
            opacity="0.045"
          />

          {/* markings */}
          <g fill="none" stroke="hsl(48 30% 97%)" strokeOpacity="0.86" strokeWidth="1.6">
            <path d={line(-HALF_LEN, 0, -HALF_LEN, WIDTH_DOUBLES)} />
            <path d={line(HALF_LEN, 0, HALF_LEN, WIDTH_DOUBLES)} />
            <path d={line(-HALF_LEN, 0, HALF_LEN, 0)} strokeWidth="2.4" />
            <path d={line(-HALF_LEN, WIDTH_DOUBLES, HALF_LEN, WIDTH_DOUBLES)} strokeWidth="1.1" />
            <path d={line(-HALF_LEN, NEAR_SINGLES, HALF_LEN, NEAR_SINGLES)} strokeWidth="2" />
            <path d={line(-HALF_LEN, FAR_SINGLES, HALF_LEN, FAR_SINGLES)} strokeWidth="1.2" />
            <path d={line(-SERVICE, NEAR_SINGLES, -SERVICE, FAR_SINGLES)} />
            <path d={line(SERVICE, NEAR_SINGLES, SERVICE, FAR_SINGLES)} />
            <path d={line(-SERVICE, MID_Z, SERVICE, MID_Z)} strokeWidth="1.3" />
            <path d={line(-HALF_LEN + CENTER_MARK, MID_Z, -HALF_LEN, MID_Z)} strokeWidth="1.3" />
            <path d={line(HALF_LEN - CENTER_MARK, MID_Z, HALF_LEN, MID_Z)} strokeWidth="1.3" />
          </g>

          {netNode}

          {/* ball shadow */}
          <ellipse
            cx={shadow.x}
            cy={shadow.y}
            rx={shadowRx}
            ry={shadowRy}
            fill="hsl(200 34% 20%)"
            opacity={shadowOpacity}
            filter={lift > 0.1 ? "url(#shadowSoft)" : undefined}
          />

          {/* ball */}
          <g transform={`translate(${f1(ball.x)} ${f1(ball.y)})`}>
            <g transform={`scale(${(2 - squash).toFixed(3)} ${squash.toFixed(3)})`}>
              <g transform={`rotate(${spin.toFixed(2)})`}>
                <image
                  href={ballAsset.url}
                  x={-ballR}
                  y={-ballR}
                  width={ballR * 2}
                  height={ballR * 2}
                  preserveAspectRatio="xMidYMid meet"
                />
              </g>
              {/* warm sunset light wrap so the ball sits in the scene */}
              <g clipPath="url(#ballClip)">
                <circle r={ballR} fill="url(#ballWarm)" />
              </g>
            </g>
          </g>
        </svg>
      </div>
    </section>
  );
};

export default CourtScrollAnimation;
