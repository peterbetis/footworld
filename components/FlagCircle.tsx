import Image from "next/image";

/** A country flag cropped into a circle. */
export default function FlagCircle({
  src,
  country,
  size,
  className = "",
  padded = true,
}: {
  src: string;
  country: string;
  size: number;
  className?: string;
  /** ESPN flags have a border and padding that must be zoomed past; Wikimedia flags don't. */
  padded?: boolean;
}) {
  return (
    <span
      className={`block shrink-0 overflow-hidden rounded-full ring-1 ring-black/15 dark:ring-white/20 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* ESPN flags have a border and padding; zoom in so the flag fills the circle. */}
      <Image
        src={src}
        alt={country}
        width={size * 2}
        height={size * 2}
        className={`h-full w-full object-cover ${padded ? "scale-[1.9]" : ""}`}
      />
    </span>
  );
}
