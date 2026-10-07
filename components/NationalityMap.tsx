"use client";

import { interpolateZoom } from "d3-interpolate";
import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import Image from "next/image";
import { useT } from "./I18nProvider";

export interface MapData {
  width: number;
  height: number;
  countries: { key: string; name: string; d: string }[];
  /** Initial and reset view. */
  defaultView: { k: number; tx: number; ty: number };
  /** Mercator projection parameters, for placing birthplace pins (see lib/worldMap). */
  projection?: { scale: number; tx: number; ty: number };
}

/** A player's birthplace, pinned on the map while their country is selected. */
export interface MapPin {
  playerId: string;
  name: string;
  number: number | null;
  /** "London, England". */
  place: string;
  lat: number;
  lon: number;
}

/** Pins close together on screen (same town, or neighbours at this zoom) share one marker. */
interface PinGroup {
  key: string;
  x: number;
  y: number;
  pins: MapPin[];
}

const PIN_MERGE_PX = 16;

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

export interface Placed<T = CountryMarker> {
  marker: T;
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
const MAX_ZOOM = 16;
const HOME: View = { k: 1, tx: 0, ty: 0 };

/**
 * Nudges markers apart so none overlap, keeping each as close as possible to
 * its country. Works in on-screen pixels, so it adapts to width and zoom.
 */
export function placeMarkers<T>(
  anchors: { marker: T; ax: number; ay: number }[],
  w: number,
  h: number,
  r: number,
) {
  const pts: Placed<T>[] = anchors.map((a) => ({ ...a, x: a.ax, y: a.ay }));
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

/** Ease in and out, so moves start and settle gently. */
const ease = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

export default function NationalityMap({
  map,
  markers,
  selected,
  previewed = null,
  onSelect,
  onPreview,
  playersByCountry = {},
  onPlayer,
  pins = [],
  selectedPlayerId = null,
  hoveredPlayerId = null,
  onPinHover,
}: {
  map: MapData;
  markers: CountryMarker[];
  selected: string | null;
  /** Country to highlight temporarily, e.g. while a player tile is hovered. */
  previewed?: string | null;
  onSelect: (country: string) => void;
  /** Called while a country shape with players is hovered (null when it isn't). */
  onPreview?: (country: string | null) => void;
  /** Players per nationality (by English name), shown when hovering the selected flag. */
  playersByCountry?: Record<string, { id: string; name: string; number: number | null }[]>;
  /** A player was clicked: in the players popover, or a birthplace pin. */
  onPlayer?: (playerId: string) => void;
  /** Birthplaces of the selected country's players. */
  pins?: MapPin[];
  /** Selected player, whose pin stands out. */
  selectedPlayerId?: string | null;
  /** Player hovered in the squad: their pin shows hovered (enlarged, with its card). */
  hoveredPlayerId?: string | null;
  /** Players under the pointer on a pin or its card (null when none), for their tiles. */
  onPinHover?: (playerIds: string[] | null) => void;
}) {
  const t = useT();
  // Country hovered on the map itself (shape or flag): previews it across the page
  // and shows its name above the flag.
  const [mapHover, setMapHover] = useState<string | null>(null);
  // Flag (not shape) currently hovered or focused: drives the players popover.
  const [flagHover, setFlagHover] = useState<string | null>(null);
  // The pointer is over the players popover itself (keeps it open).
  const [popoverHover, setPopoverHover] = useState(false);
  // Country whose players the popover shows (kept while it fades out).
  const [popoverCountry, setPopoverCountry] = useState<string | null>(null);
  // Leaving the flag closes the popover after a short grace period, so the pointer
  // can cross the gap between the flag and the popover.
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const leaveFlag = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setFlagHover(null), 150);
  };
  useEffect(() => cancelClose, []);
  // Birthplace pin whose card is showing (by group key); hovering a pin opens it,
  // and like the players popover it stays open while the pointer crosses to it.
  const [pinOpen, setPinOpen] = useState<string | null>(null);
  const pinTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelPinClose = () => {
    if (pinTimer.current) clearTimeout(pinTimer.current);
    pinTimer.current = null;
  };
  const closePinSoon = () => {
    cancelPinClose();
    pinTimer.current = setTimeout(() => setPinOpen(null), 150);
  };
  useEffect(() => cancelPinClose, []);
  const openPlayer = (playerId: string) => {
    cancelPinClose();
    setPinOpen(null);
    onPlayer?.(playerId);
  };
  const hover = (country: string | null) => {
    setMapHover(country);
    onPreview?.(country);
  };
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  const [view, setViewState] = useState<View>(map.defaultView ?? HOME);

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
      // Smooth zoom (van Wijk & Nuij, via d3): interpolate the visible window's centre
      // and width so long moves zoom out a little, travel, then zoom back in, instead of
      // sliding and scaling independently.
      const windowOf = (v: View): [number, number, number] => [
        (map.width / 2 - v.tx) / v.k,
        (map.height / 2 - v.ty) / v.k,
        map.width / v.k,
      ];
      const path = interpolateZoom(windowOf(from), windowOf(to));
      // Longer trips take longer, within a comfortable range.
      const duration = Math.min(1100, Math.max(500, path.duration * 0.7));
      const t0 = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / duration);
        const [cx, cy, w] = path(ease(t));
        const k = map.width / w;
        setView(t < 1 ? { k, tx: map.width / 2 - cx * k, ty: map.height / 2 - cy * k } : to);
        if (t < 1) animRef.current = requestAnimationFrame(step);
      };
      animRef.current = requestAnimationFrame(step);
    },
    [clamp, setView, map.width, map.height],
  );

  const zoomBy = (factor: number, sx = (width ?? 0) / 2, sy = height / 2) => {
    const from = viewRef.current;
    animateTo(zoomedAt(from, from.k * factor, sx, sy));
  };

  /** Centres the map on a country at maximum zoom. */
  const focusOn = (country: string) => {
    const m = markers.find((x) => x.country === country);
    if (!m) return;
    const k = MAX_ZOOM;
    // Put the country's point at the centre of the frame; clamping keeps the map in view.
    animateTo({ k, tx: map.width / 2 - m.x * k, ty: map.height / 2 - m.y * k });
  };

  /** Click on a country or its flag: select it (the effect below positions the map). */
  const clickCountry = (country: string) => onSelect(country);

  // Whenever a new country becomes selected — from the map, a nationality ring or a
  // player — centre on it at maximum zoom. Clearing the selection ("Show all", the
  // club crest, clicking the selection again) flies back to the default view.
  const followSelection = useEffectEvent((country: string | null) =>
    country ? focusOn(country) : animateTo(map.defaultView ?? HOME),
  );
  const lastSelected = useRef(selected);
  useEffect(() => {
    if (selected !== lastSelected.current) followSelection(selected);
    lastSelected.current = selected;
  }, [selected]);

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
    // A press anywhere but a pin or its card closes the pin card (touch has no hover-out).
    if (!(e.target as HTMLElement).closest("[data-pin]")) setPinOpen(null);
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
  // The popover opens from the selected country's flag, or from any flag at maximum zoom.
  const atMaxZoom = view.k >= MAX_ZOOM - 0.001;
  const canPopover = (country: string) => country === selected || atMaxZoom;
  const popoverOpen =
    popoverCountry !== null &&
    ((flagHover === popoverCountry && canPopover(popoverCountry)) || popoverHover);
  const home = map.defaultView ?? HOME;
  const atHome =
    Math.abs(view.k - home.k) < 0.001 &&
    Math.abs(view.tx - home.tx) < 0.5 &&
    Math.abs(view.ty - home.ty) < 0.5;
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
  // Rectangular flags (8:5), slightly smaller than the radius-based spacing allows.
  const flagW = Math.round(r * 1.8);
  const flagH = Math.round((flagW * 5) / 8);

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

  // Birthplace pins on screen, merged where they'd overlap; off-screen ones are skipped.
  const pinGroups: PinGroup[] = [];
  if (width && map.projection) {
    const { scale: s, tx, ty } = map.projection;
    for (const pin of pins) {
      const lambda = (pin.lon * Math.PI) / 180;
      const phi = (Math.max(-85, Math.min(85, pin.lat)) * Math.PI) / 180;
      const mx = tx + s * lambda;
      const my = ty - s * Math.log(Math.tan(Math.PI / 4 + phi / 2));
      const x = (mx * view.k + view.tx) * scale;
      const y = (my * view.k + view.ty) * scale;
      if (x < -20 || x > width + 20 || y < -20 || y > height + 40) continue;
      const near = pinGroups.find((g) => Math.hypot(g.x - x, g.y - y) < PIN_MERGE_PX);
      if (near) near.pins.push(pin);
      else pinGroups.push({ key: pin.playerId, x, y, pins: [pin] });
    }
  }

  // The pin shown hovered: under the pointer, or the one of the player hovered in the squad.
  const linkedPin =
    pinGroups.find((g) => g.pins.some((p) => p.playerId === hoveredPlayerId))?.key ?? null;
  const shownPin = pinOpen ?? linkedPin;

  return (
    <div
      ref={boxRef}
      className={`relative w-full overflow-hidden rounded-lg bg-map-sea select-none ${
        // Touch: vertical swipes keep scrolling the page until the user zooms in past the
        // default view; horizontal drags still pan the map.
        view.k > home.k + 0.001
          ? "cursor-grab touch-none active:cursor-grabbing"
          : zoomed
            ? "cursor-grab touch-pan-y active:cursor-grabbing"
            : "touch-pan-y"
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
                stroke="var(--map-border)"
                strokeWidth="0.5"
                vectorEffect="non-scaling-stroke"
                className={`transition-[fill] duration-150 ${country ? "cursor-pointer" : ""}`}
                onPointerEnter={
                  country ? (e) => e.pointerType === "mouse" && hover(country) : undefined
                }
                onPointerLeave={country ? () => hover(null) : undefined}
                onClick={country ? () => clickCountry(country) : undefined}
                style={{
                  fill:
                    c.key === selectedKey || c.key === previewedKey
                      ? "color-mix(in oklab, var(--accent) 75%, var(--map-land))"
                      : tinted.has(c.key)
                        ? "color-mix(in oklab, var(--accent) 30%, var(--map-land))"
                        : "var(--map-land)",
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
            onClick={() => clickCountry(p.marker.country)}
            // Hovering (or focusing) a flag highlights its country, like hovering the shape.
            onPointerEnter={(e) => {
              if (e.pointerType !== "mouse") return;
              hover(p.marker.country);
              cancelClose();
              setFlagHover(p.marker.country);
              if (canPopover(p.marker.country)) setPopoverCountry(p.marker.country);
            }}
            onPointerLeave={() => {
              hover(null);
              leaveFlag();
            }}
            onFocus={() => {
              hover(p.marker.country);
              setFlagHover(p.marker.country);
              if (canPopover(p.marker.country)) setPopoverCountry(p.marker.country);
            }}
            onBlur={() => {
              hover(null);
              setFlagHover(null);
            }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-[3px] transition-[scale,opacity] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              isSelected
                ? "z-20 scale-125 ring-2 ring-accent ring-offset-1 ring-offset-bg"
                : isPreviewed
                  ? "z-20 scale-125 ring-2 ring-accent/60 ring-offset-1 ring-offset-bg"
                  : "z-10 hover:z-20 hover:scale-125"
            } ${dimmed ? "opacity-50 hover:opacity-100" : ""}`}
            style={{ left: p.x, top: p.y }}
          >
            <FlagRect src={p.marker.flag} width={flagW} height={flagH} />
            {p.marker.count > 1 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-text px-0.5 text-[10px] leading-none font-bold text-surface">
                {p.marker.count}
              </span>
            )}
          </button>
        );
      })}

      {/* Birthplace pins of the selected country's players. */}
      {pinGroups.map((g) => {
        const single = g.pins.length === 1 ? g.pins[0] : null;
        const isSelected = g.pins.some((p) => p.playerId === selectedPlayerId);
        const label = single
          ? t.bornIn(single.name, single.place)
          : t.bornInMany(g.pins.length, g.pins[0].place);
        return (
          <button
            key={g.key}
            type="button"
            data-pin
            aria-label={label}
            aria-expanded={single ? undefined : shownPin === g.key}
            onClick={() => (single ? openPlayer(single.playerId) : setPinOpen(g.key))}
            onPointerEnter={(e) => {
              if (e.pointerType !== "mouse") return;
              cancelPinClose();
              setPinOpen(g.key);
              onPinHover?.(g.pins.map((p) => p.playerId));
            }}
            onPointerLeave={() => {
              closePinSoon();
              onPinHover?.(null);
            }}
            onFocus={() => setPinOpen(g.key)}
            onBlur={closePinSoon}
            className={`pin-drop absolute z-[25] -translate-x-1/2 -translate-y-full cursor-pointer outline-none drop-shadow-[0_2px_2px_rgb(0_0_0/0.35)] transition-[scale] duration-150 [transform-origin:50%_100%] hover:scale-115 focus-visible:scale-115 ${
              isSelected || shownPin === g.key ? "scale-115" : ""
            }`}
            style={{ left: g.x, top: g.y }}
          >
            <svg viewBox="0 0 24 32" width="24" height="32" aria-hidden>
              <path
                d="M12 1C5.9 1 1 5.8 1 11.8 1 20 12 31 12 31s11-11 11-19.2C23 5.8 18.1 1 12 1Z"
                fill={isSelected ? "var(--text)" : "var(--accent)"}
                stroke="white"
                strokeWidth="1.6"
              />
              {single ? (
                <circle cx="12" cy="11.8" r="4" fill="white" />
              ) : (
                <text
                  x="12"
                  y="15.6"
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill="white"
                >
                  {g.pins.length}
                </text>
              )}
            </svg>
          </button>
        );
      })}

      {/* Pin card: who was born there; names open the player's profile. */}
      {(() => {
        const g = pinGroups.find((x) => x.key === shownPin);
        if (!g || !width) return null;
        const CARD_W = 210;
        const places = [...new Set(g.pins.map((p) => p.place))];
        // One place: it's the header. Several: each row says where.
        const perRow = places.length > 1;
        const estH = 40 + g.pins.length * (perRow ? 40 : 28);
        const PIN_H = 32 * 1.15;
        // Above the pin if it fits, else on whichever side has more room; the list is
        // capped to that room (and scrolls), so the map's edge never cuts the card off.
        const roomAbove = g.y - PIN_H - 8 - 4;
        const roomBelow = height - g.y - 6 - 4;
        const above = roomAbove >= estH || roomAbove >= roomBelow;
        const listMax = Math.max(60, Math.min(224, (above ? roomAbove : roomBelow) - 40));
        const left = Math.min(width - CARD_W / 2 - 6, Math.max(CARD_W / 2 + 6, g.x));
        return (
          <div
            data-pin
            role="group"
            aria-label={perRow ? t.bornHere(g.pins.length) : places[0]}
            onPointerEnter={() => {
              cancelPinClose();
              onPinHover?.(g.pins.map((p) => p.playerId));
            }}
            onPointerLeave={() => {
              closePinSoon();
              onPinHover?.(null);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="pin-card absolute z-40 cursor-default rounded-xl border border-border bg-surface p-2 text-left shadow-xl"
            style={{
              left,
              top: above ? g.y - PIN_H - 6 : g.y + 6,
              width: CARD_W,
              transform: `translate(-50%, ${above ? "-100%" : "0"})`,
            }}
          >
            <p className="mb-1 flex items-center gap-1 border-b border-border px-1 pb-1.5 text-[11px] font-semibold text-muted">
              <svg viewBox="0 0 24 32" className="h-3 w-2.5 shrink-0 text-accent" aria-hidden>
                <path
                  d="M12 1C5.9 1 1 5.8 1 11.8 1 20 12 31 12 31s11-11 11-19.2C23 5.8 18.1 1 12 1Z"
                  fill="currentColor"
                />
              </svg>
              <span className="truncate">{perRow ? t.bornHere(g.pins.length) : places[0]}</span>
            </p>
            <ul
              className="overflow-y-auto overscroll-contain [scrollbar-width:thin]"
              style={{ maxHeight: listMax }}
            >
              {g.pins.map((p) => (
                <li key={p.playerId}>
                  <button
                    type="button"
                    onClick={() => openPlayer(p.playerId)}
                    // Just this player's tile while their name is hovered.
                    onPointerEnter={() => onPinHover?.([p.playerId])}
                    onPointerLeave={() => onPinHover?.(g.pins.map((x) => x.playerId))}
                    className="flex w-full cursor-pointer items-baseline gap-2 rounded-md px-1 py-1 text-left text-sm transition-colors outline-none hover:bg-accent/15 focus-visible:bg-accent/15 focus-visible:ring-1 focus-visible:ring-accent"
                  >
                    <span className="w-6 shrink-0 text-right text-xs font-bold tabular-nums text-accent">
                      {p.number ?? "–"}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold underline-offset-2 hover:underline">
                        {p.name}
                      </span>
                      {perRow && (
                        <span className="block truncate text-[11px] text-muted">{p.place}</span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })()}

      {/* Name labels above the flags of the selected country (kept while selected)
          and the country hovered on the map. */}
      {[...new Set([selected, mapHover])].map((country) => {
        const p = country ? placed.find((x) => x.marker.country === country) : null;
        if (!p) return null;
        // The players popover already shows the name while it's open.
        if (popoverOpen && p.marker.country === popoverCountry) return null;
        // The selected flag is drawn at 125%, so its label sits a little higher.
        const lift = (flagH / 2) * (p.marker.country === selected ? 1.25 : 1) + 6;
        return (
          <span
            key={p.marker.country}
            role="tooltip"
            className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full rounded-md bg-text px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-surface shadow-md"
            style={{ left: p.x, top: p.y - lift }}
          >
            {p.marker.name}
          </span>
        );
      })}

      {/* Players popover: hovering the selected country's flag (or any flag at maximum
          zoom) lists that country's players. */}
      {(() => {
        const p = popoverCountry ? placed.find((x) => x.marker.country === popoverCountry) : null;
        const list = popoverCountry ? (playersByCountry[popoverCountry] ?? []) : [];
        if (!p || !width || list.length === 0) return null;
        const POP_W = 200;
        const estH = 36 + list.length * 22;
        const lift = (flagH / 2) * 1.25 + 8;
        // Above the flag if it fits, otherwise below; always kept inside the frame.
        const above = p.y - lift - estH >= 4;
        const left = Math.min(width - POP_W / 2 - 6, Math.max(POP_W / 2 + 6, p.x));
        const top = above ? p.y - lift : p.y + lift;
        return (
          <div
            role="group"
            aria-label={p.marker.name}
            aria-hidden={!popoverOpen}
            inert={!popoverOpen}
            // Hovering the popover keeps it open; leaving it (or the flag) closes it.
            onPointerEnter={() => {
              cancelClose();
              setPopoverHover(true);
            }}
            onPointerLeave={() => {
              setPopoverHover(false);
              setFlagHover(null);
            }}
            // Don't let presses on the popover start dragging the map.
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className={`absolute z-40 cursor-default rounded-xl border border-border bg-surface p-2.5 text-left shadow-xl transition-[opacity,transform] duration-200 ease-out ${
              popoverOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            }`}
            style={{
              left,
              top,
              width: POP_W,
              transform: `translate(-50%, ${above ? "-100%" : "0"}) scale(${popoverOpen ? 1 : 0.92})`,
              transformOrigin: above ? "bottom center" : "top center",
            }}
          >
            <p className="mb-1.5 border-b border-border pb-1.5 text-xs font-bold">
              {p.marker.name}
              <span className="ml-1 font-normal text-muted">· {list.length}</span>
            </p>
            <ul className="max-h-64 space-y-0.5 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]">
              {list.map((pl) => (
                <li key={pl.id}>
                  {/* Opens the player's profile; the popover closes behind it. */}
                  <button
                    type="button"
                    onClick={() => {
                      setPopoverHover(false);
                      setFlagHover(null);
                      onPlayer?.(pl.id);
                    }}
                    className="flex w-full cursor-pointer items-baseline gap-2 rounded-md px-1 py-0.5 text-left text-xs transition-colors outline-none hover:bg-accent/15 focus-visible:bg-accent/15 focus-visible:ring-1 focus-visible:ring-accent"
                  >
                    <span className="w-6 shrink-0 text-right font-bold tabular-nums text-accent">
                      {pl.number ?? "–"}
                    </span>
                    <span className="truncate underline-offset-2 hover:underline">{pl.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })()}

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
        <ZoomButton
          label={t.zoomOut}
          disabled={view.k <= MIN_ZOOM + 0.001}
          onClick={() => zoomBy(0.5)}
        >
          <path d="M4 10h12" />
        </ZoomButton>
        <ZoomButton label={t.resetZoom} disabled={atHome} onClick={() => animateTo(home)}>
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

/**
 * A flag as a small 8:5 rectangle. ESPN's flag images are square with transparent
 * padding and a dark border around the flag, so the image is zoomed to crop them.
 */
function FlagRect({ src, width, height }: { src: string; width: number; height: number }) {
  return (
    <span
      className="block overflow-hidden rounded-[3px] shadow-sm ring-1 ring-black/25"
      style={{ width, height }}
    >
      <Image
        src={src}
        alt=""
        width={width * 2}
        height={width * 2}
        className="h-full w-full scale-[1.2] object-cover"
      />
    </span>
  );
}
