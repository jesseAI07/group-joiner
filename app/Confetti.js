"use client";
import { useEffect, useRef } from "react";

export default function Confetti() {
  const ref = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = ref.current;
    const ctx = c.getContext("2d");
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    const colors = ["#128c4a", "#f5c518", "#e5484d", "#2f80ed", "#9b51e0"];

    // Two cannons, one at each bottom corner, firing toward the middle.
    const bits = Array.from({ length: 160 }, (_, i) => {
      const left = i % 2 === 0;
      return {
        x: left ? c.width * 0.05 : c.width * 0.95,
        y: c.height,
        vx: (left ? 1 : -1) * (3 + Math.random() * 8),
        vy: -(12 + Math.random() * 10),
        s: 5 + Math.random() * 6,
        r: Math.random() * 6,
        vr: (Math.random() - 0.5) * 0.4,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    });

    let frames = 0;
    let raf;
    let cancelled = false;
    const draw = () => {
      if (cancelled) return;
      ctx.clearRect(0, 0, c.width, c.height);
      bits.forEach((p) => {
        p.vy += 0.35;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
        ctx.restore();
      });
      if (++frames < 180) raf = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, c.width, c.height);
    };
    draw();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={ref} className="confetti" aria-hidden="true" />;
}