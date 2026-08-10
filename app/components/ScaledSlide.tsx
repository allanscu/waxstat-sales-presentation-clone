"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

const W = 1280;
const H = 720;

/**
 * Renders a 1280×720 slide canvas scaled to fit the available width (preview)
 * or the whole viewport (present mode), preserving the 16:9 aspect ratio.
 *
 * This is what lets slides be authored in absolute px: one CSS transform here
 * makes the result resolution-independent everywhere it's shown.
 */
export default function ScaledSlide({
  children,
  mode = "fit-width",
}: {
  children: ReactNode;
  mode?: "fit-width" | "fit-screen";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    function update() {
      if (mode === "fit-screen") {
        setScale(Math.min(window.innerWidth / W, window.innerHeight / H));
        return;
      }
      const el = ref.current;
      if (el) setScale(el.clientWidth / W);
    }
    update();
    window.addEventListener("resize", update);
    let ro: ResizeObserver | undefined;
    if (mode === "fit-width" && ref.current) {
      ro = new ResizeObserver(update);
      ro.observe(ref.current);
    }
    return () => {
      window.removeEventListener("resize", update);
      ro?.disconnect();
    };
  }, [mode]);

  return (
    <div
      ref={ref}
      style={{
        width: mode === "fit-screen" ? W * scale : "100%",
        height: H * scale,
        position: "relative",
      }}
    >
      <div
        style={{
          width: W,
          height: H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}
