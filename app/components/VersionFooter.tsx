import { BRAND } from "@/lib/deck";

/** Build-version badge. The value is baked in at build time by next.config.ts. */
export default function VersionFooter() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION || "dev";
  return (
    <footer className="no-print mt-12 pb-6 text-center">
      <span className="inline-flex items-center gap-1.5 text-xs text-ink/50">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
        {BRAND.product} · {version}
      </span>
    </footer>
  );
}
