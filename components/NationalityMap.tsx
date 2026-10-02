"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import FlagCircle from "./FlagCircle";
import { useT } from "./I18nProvider";

export interface MapData {
  width: number;
  height: number;
  countries: { key: string; name: string; d: string }[];
}

export interface CountryMarker {
  /** English name: the key shared with players' nationalities. */
  country: string;
  /** Display name in the page's language. */
  name: string;
  flag: string;
  count: number;
  /** Anchor in map units. */
  x: number;
  y: number;
  countryKey: string | null;
}

interface Placed {
  marker: CountryMarker;
  ax: number;
  ay: number;
  x: number;
  y: number;
}

/** Zoom level and pan offset, in map units: screen = (mapPoint * k + t) * pixelsPerUnit. */
interface View {
  k: number;
  tx: number;
  ty: number;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
const HOME: View = { k: 1, tx: 0, ty: 0 };

/**
 * Nudges markers apart so none overlap, keeping each as close as possible to
 * its country. Works in on-screen pixels, so it adapts to width and zoom.
 */
function placeMarkers(
  anchors: { marker: CountryMarker; ax: number; ay: number }[],
  w: number,
  h: number,
  r: number,
) {
  const pts: Placed[] = anchors.map((a) => ({ ...a, x: a.ax, y: a.ay }));
  // Extra room so count badges (top-right of each flag) don't get covered.
  const min = 2 * r + 10;
  for (let iter = 0; iter < 400; iter++) {
    let overlapping = false;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i];
        const b = pts[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d = Math.hypot(dx, dy);
        if (d >= min) continue;
        overlapping = true;
        if (d < 0.01) {
          // Same spot: split along a stable, index-based direction.
          const angle = (i * 2.399 + j) % (2 * Math.PI);
          dx = Math.cos(angle);
          dy = Math.sin(angle);
          d = 1;
        }
        const push = (min - d) / 2;
        const ux = dx / d;
        const uy = dy / d;
        a.x -= ux * push;
        a.y -= uy * push;
        b.x += ux * push;
        b.y += uy * push;
      }
    }
    for (const p of pts) {
      // Gentle pull back towards the country, then keep inside the map.
      p.x += (p.ax - p.x) * 0.01;
      p.y += (p.ay - p.y) * 0.01;
      p.x = Math.min(w - r, Math.max(r, p.x));
      p.y = Math.min(h - r, Math.max(r, p.y));
    }
    if (!overlapping) break;
  }
  return pts;
}

const ease = (t: number) => 1 - (1 - t) ** 3;

export default function NationalityMap({
  map,
  markers,
  selected,
  previewed = null,
  onSelect,
  onPreview,
}: {
  map: MapData;
  markers: CountryMarker[];
  selected: string | null;
  /** Country to highlight temporarily, e.g. while a player tile is hovered. */
  previewed?: string | null;
  onSelect: (country: string) => void;
  /** Called while a country shape with players is hovered (null when it isn't). */
  onPreview?: (country: string | null) => void;
}) {
  const t = useT();
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  const [view, setViewState] = useState<View>(HOME);

  // Mirrors of state for native/gesture handlers that outlive a render.
  const viewRef = useRef(view);
  const scaleRef = useRef(0);
  const animRef = useRef(0);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<
    | { kind: "pan"; x: number; y: number; start: View; moved: boolean }
    | { kind: "pinch"; dist: number; ux: number; uy: number; start: View }
    | null
  >(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      scaleRef.current = entry.contentRect.width / map.width;
      setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [map.width]);

  const scale = width ? width / map.width : 0;
  const height = map.height * scale;

  /** Keeps the zoom in range and the map covering the whole frame. */
  const clamp = useCallback(
    (v: View): View => {
      const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.k));
      return {
        k,
        tx: Math.min(0, Math.max(map.width - map.width * k, v.tx)),
        ty: Math.min(0, Math.max(map.height - map.height * k, v.ty)),
      };
    },
    [map.width, map.height],
  );

  const setView = useCallback(
    (v: View) => {
      const next = clamp(v);
      viewRef.current = next;
      setViewState(next);
    },
    [clamp],
  );

  /** The view after zooming to `k`, keeping the screen point (sx, sy) fixed. */
  const zoomedAt = useCallback((from: View, target: number, sx: number, sy: number): View => {
    // Clamp the zoom first so the anchor maths uses the zoom that will actually apply.
    const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, target));
    const s = scaleRef.current;
    const ux = (sx / s - from.tx) / from.k;
    const uy = (sy / s - from.ty) / from.k;
    return { k, tx: sx / s - ux * k, ty: sy / s - uy * k };
  }, []);

  const animateTo = useCallback(
    (target: View) => {
      cancelAnimationFrame(animRef.current);
      const from = viewRef.current;
      const to = clamp(target);
      const t0 = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / 220);
        const e = ease(t);
        setView({
          k: from.k + (to.k - from.k) * e,
          tx: from.tx + (to.tx - from.tx) * e,
          ty: from.ty + (to.ty - from.ty) * e,
        });
        if (t < 1) animRef.current = requestAnimationFrame(step);
      };
      animRef.current = requestAnimationFrame(step);
    },
    [clamp, setView],
  );

  const zoomBy = (factor: number, sx = (width ?? 0) / 2, sy = height / 2) => {
    const from = viewRef.current;
    animateTo(zoomedAt(from, from.k * factor, sx, sy));
  };

  // Ctrl/⌘ + wheel (and trackpad pinch, which arrives as ctrl + wheel) zooms
  // around the cursor. A plain wheel is left alone so the page still scrolls.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      cancelAnimationFrame(animRef.current);
      const rect = el.getBoundingClientRect();
      const from = viewRef.current;
      // ~1.5× per mouse-wheel notch; trackpad pinches send small deltas for fine control.
      const factor = Math.exp(-e.deltaY * 0.004);
      setView(zoomedAt(from, from.k * factor, e.clientX - rect.left, e.clientY - rect.top));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [setView, zoomedAt]);

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  const local = (e: React.PointerEvent) => {
    const rect = boxRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    cancelAnimationFrame(animRef.current);
    // A drag released off a flag fires no click, so clear any stale suppression.
    if (pointers.current.size === 0) suppressClick.current = false;
    pointers.current.set(e.pointerId, local(e));
    const pts = [...pointers.current.values()];
    if (pts.length === 1) {
      gesture.current = {
        kind: "pan",
        x: pts[0].x,
        y: pts[0].y,
        start: viewRef.current,
        moved: false,
      };
    } else if (pts.length === 2) {
      const [a, b] = pts;
      const start = viewRef.current;
      const s = scaleRef.current;
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      gesture.current = {
        kind: "pinch",
        dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        // Map point under the fingers' midpoint stays under it while pinching.
        ux: (mx / s - start.tx) / start.k,
        uy: (my / s - start.ty) / start.k,
        start,
      };
      suppressClick.current = true;
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, local(e));
    const g = gesture.current;
    const s = scaleRef.current;
    if (!g || !s) return;
    const pts = [...pointers.current.values()];

    if (g.kind === "pinch" && pts.length >= 2) {
      const [a, b] = pts;
      const k = g.start.k * (Math.hypot(a.x - b.x, a.y - b.y) / g.dist);
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      setView({ k, tx: mx / s - g.ux * k, ty: my / s - g.uy * k });
    } else if (g.kind === "pan") {
      const dx = pts[0].x - g.x;
      const dy = pts[0].y - g.y;
      if (!g.moved && Math.hypot(dx, dy) > 4) {
        g.moved = true;
        suppressClick.current = true;
        boxRef.current?.setPointerCapture(e.pointerId);
      }
      if (g.moved) setView({ ...g.start, tx: g.start.tx + dx / s, ty: g.start.ty + dy / s });
    }
  };

  const onPointerEnd = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    const rest = [...pointers.current.values()];
    // Lifting one finger of a pinch continues as a pan with the other.
    gesture.current =
      rest.length === 1
        ? { kind: "pan", x: rest[0].x, y: rest[0].y, start: viewRef.current, moved: true }
        : null;
  };

  const zoomed = view.k > 1.001;
  const tinted = new Set(markers.map((m) => m.countryKey).filter(Boolean));
  const selectedKey = markers.find((m) => m.country === selected)?.countryKey ?? null;
  const previewedKey = markers.find((m) => m.country === previewed)?.countryKey ?? null;
  // Map shape → nationality. Markers are sorted by player count, so a shape shared
  // by several nationalities (the UK) maps to the one with most players.
  const countryByKey = new Map<string, string>();
  for (const m of markers) {
    if (m.countryKey && !countryByKey.has(m.countryKey)) countryByKey.set(m.countryKey, m.country);
  }
  // Marker radius: smaller at the whole-world view (70%), growing to full size
  // by 2× zoom, so the unzoomed map isn't crowded with flags.
  const fullR = width && width < 640 ? 10 : 12;
  const r = Math.round(fullR * Math.min(1, 0.7 + 0.3 * (view.k - 1)));

  // Marker anchors on screen at the current zoom; off-screen countries are skipped.
  const anchors = width
    ? markers
        .map((m) => ({
          marker: m,
          ax: (m.x * view.k + view.tx) * scale,
          ay: (m.y * view.k + view.ty) * scale,
        }))
        .filter((a) => a.ax >= -r && a.ax <= width + r && a.ay >= -r && a.ay <= height + r)
    : [];
  const placed = width ? placeMarkers(anchors, width, height, r) : [];

  return (
    <div
      ref={boxRef}
      className={`relative w-full overflow-hidden rounded-lg select-none ${
        zoomed ? "cursor-grab touch-none active:cursor-grabbing" : "touch-pan-y"
      }`}
      style={{ aspectRatio: `${map.width} / ${map.height}` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      // Flags are images, which browsers drag natively; that would cancel the pan.
      onDragStart={(e) => e.preventDefault()}
      onClickCapture={(e) => {
        // A drag or pinch that ends on a flag shouldn't also select it.
        if (suppressClick.current) {
          e.stopPropagation();
          e.preventDefault();
          suppressClick.current = false;
        }
      }}
      onDoubleClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        const rect = boxRef.current!.getBoundingClientRect();
        zoomBy(2, e.clientX - rect.left, e.clientY - rect.top);
      }}
    >
      <svg
        viewBox={`0 0 ${map.width} ${map.height}`}
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <g transform={`translate(${view.tx} ${view.ty}) scale(${view.k})`}>
          {map.countries.map((c) => {
            // Countries with players respond to hover (highlighted like a selection) and click.
            const country = countryByKey.get(c.key);
            return (
              <path
                key={c.key}
                d={c.d}
                stroke="var(--surface)"
                strokeWidth="0.5"
                vectorEffect="non-scaling-stroke"
                className={`transition-[fill] duration-150 ${country ? "cursor-pointer" : ""}`}
                onPointerEnter={
                  country ? (e) => e.pointerType === "mouse" && onPreview?.(country) : undefined
                }
                onPointerLeave={country ? () => onPreview?.(null) : undefined}
                onClick={country ? () => onSelect(country) : undefined}
                style={{
                  fill:
                    c.key === selectedKey || c.key === previewedKey
                      ? "color-mix(in oklab, var(--accent) 75%, var(--border))"
                      : tinted.has(c.key)
                        ? "color-mix(in oklab, var(--accent) 30%, var(--border))"
                        : "var(--border)",
                }}
              />
            );
          })}
        </g>
      </svg>

      {/* Leader lines from displaced markers back to their country. */}
      {width && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          {placed.map((p) =>
            Math.hypot(p.x - p.ax, p.y - p.ay) > r * 0.6 ? (
              <g key={p.marker.country} className="text-muted">
                <line
                  x1={p.ax}
                  y1={p.ay}
                  x2={p.x}
                  y2={p.y}
                  stroke="currentColor"
                  strokeOpacity="0.6"
                  strokeWidth="1"
                />
                <circle cx={p.ax} cy={p.ay} r="1.5" fill="currentColor" />
              </g>
            ) : null,
          )}
        </svg>
      )}

      {placed.map((p) => {
        const isSelected = p.marker.country === selected;
        const isPreviewed = !isSelected && p.marker.country === previewed;
        const dimmed = selected !== null && !isSelected && !isPreviewed;
        const label = t.markerLabel(p.marker.name, p.marker.count);
        return (
          <button
            key={p.marker.country}
            type="button"
            aria-pressed={isSelected}
            aria-label={label}
            title={label}
            onClick={() => onSelect(p.marker.country)}
            // Hovering (or focusing) a flag highlights its country, like hovering the shape.
            onPointerEnter={(e) => e.pointerType === "mouse" && onPreview?.(p.marker.country)}
            onPointerLeave={() => onPreview?.(null)}
            onFocus={() => onPreview?.(p.marker.country)}
            onBlur={() => onPreview?.(null)}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-[scale,opacity] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              isSelected
                ? "z-20 scale-125 ring-2 ring-accent ring-offset-1 ring-offset-bg"
                : isPreviewed
                  ? "z-20 scale-125 ring-2 ring-accent/60 ring-offset-1 ring-offset-bg"
                  : "z-10 hover:z-20 hover:scale-125"
            } ${dimmed ? "opacity-50 hover:opacity-100" : ""}`}
            style={{ left: p.x, top: p.y }}
          >
            <FlagCircle src={p.marker.flag} country="" size={r * 2} className="shadow-sm" />
            {p.marker.count > 1 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-text px-0.5 text-[10px] leading-none font-bold text-surface">
                {p.marker.count}
              </span>
            )}
          </button>
        );
      })}

      {/* Zoom controls */}
      <div
        className="absolute top-2 right-2 z-30 flex flex-col overflow-hidden rounded-lg border border-border bg-surface/90 shadow-sm backdrop-blur"
        onPointerDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <ZoomButton
          label={t.zoomIn}
          disabled={view.k >= MAX_ZOOM - 0.001}
          onClick={() => zoomBy(2)}
        >
          <path d="M10 4v12M4 10h12" />
        </ZoomButton>
        <ZoomButton label={t.zoomOut} disabled={!zoomed} onClick={() => zoomBy(0.5)}>
          <path d="M4 10h12" />
        </ZoomButton>
        <ZoomButton label={t.resetZoom} disabled={!zoomed} onClick={() => animateTo(HOME)}>
          <path d="M4 8V4h4M16 8V4h-4M4 12v4h4M16 12v4h-4" />
        </ZoomButton>
      </div>

      <p className="pointer-events-none absolute bottom-1.5 left-2 text-[11px] text-muted">
        <span className="pointer-coarse:hidden">{t.zoomHintPointer}</span>
        <span className="hidden pointer-coarse:inline">{t.zoomHintTouch}</span>
      </p>
    </div>
  );
}

function ZoomButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-[1.925rem] w-[1.925rem] items-center justify-center border-b border-border text-muted transition-colors hover:text-text last:border-b-0 hover:bg-bg disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent"
    >
      <svg
        viewBox="0 0 20 20"
        className="h-[0.9625rem] w-[0.9625rem]"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {children}
      </svg>
    </button>
  );
}
