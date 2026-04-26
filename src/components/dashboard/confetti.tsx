"use client";

import { useEffect } from "react";

export default function Confetti() {
  useEffect(() => {
    const end = Date.now() + 2000;
    const colors = ["#0891b2", "#2563B0", "#10b981"];

    import("canvas-confetti").then(({ default: confetti }) => {
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    });
  }, []);

  return null;
}
