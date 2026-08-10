import { BRAND } from "@/lib/deck";

/**
 * Placeholder vendor mark — a plain geometric glyph so the clone ships no real
 * logo artwork. Replace the <svg> body with your own vector and the wordmark
 * below picks up BRAND.name.
 */
export function Mark({ size = 40, color = "#71d8a7" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect x="2" y="2" width="44" height="44" rx="12" stroke={color} strokeWidth="3" />
      <path
        d="M14 30l7-12 7 8 6-10"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function BrandLogo({
  size = 40,
  color = "#71d8a7",
  textColor = "#ffffff",
}: {
  size?: number;
  color?: string;
  textColor?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Mark size={size} color={color} />
      <span
        style={{
          color: textColor,
          fontSize: size * 0.72,
          fontWeight: 800,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        {BRAND.name}
      </span>
    </div>
  );
}
