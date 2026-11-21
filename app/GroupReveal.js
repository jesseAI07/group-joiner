"use client";
import { useEffect, useRef, useState } from "react";

const MAX = 48; // highest group number

function confetti(c) {
  if (!c) return;
  const ctx = c.getContext("2d");
  c.width = window.innerWidth;
  c.height = window.innerHeight;
  const colors = ["#128c4a", "#f5c518", "#e5484d", "#2f80ed", "#9b51e0"];
  const bits = Array.from({ length: 140 }, () => ({
    x: c.width / 2,
    y: c.height / 2.5,
    vx: (Math.random() - 0.5) * 14,
    vy: Math.random() * -14 - 2,
    s: 5 + Math.random() * 6,
    r: Math.random() * 6,
    vr: (Math.random() - 0.5) * 0.4,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
  let frames = 0;
  const draw = () => {
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
    if (++frames < 150) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, c.width, c.height);
  };
  draw();
}

export default function GroupReveal({ group, onDone }) {
  const target = Number(group);
  const [shown, setShown] = useState(null);
  const [landed, setLanded] = useState(false);
  const canvas = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(target);
      setLanded(true);
      onDone?.();
      return;
    }
    let cancelled = false;
    let timer;
    let step = 0;
    const total = 28;

    const tick = () => {
      if (cancelled) return;
      step++;
      if (step >= total) {
        setShown(target);
        setLanded(true);
        confetti(canvas.current);
        onDone?.();
        return;
      }
      setShown(1 + Math.floor(Math.random() * MAX));
      timer = setTimeout(tick, 60 + step * step * 0.3); // starts fast, slows down
    };
    tick();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="reveal">
      <canvas ref={canvas} className="confetti" aria-hidden="true" />
      <p className="note">{landed ? "Your group is…" : "Drawing your group…"}</p>
      <div className={`slot${landed ? " landed" : ""}`} aria-hidden="true">{shown ?? "?"}</div>
      {landed && <strong className="drafted" role="status">You've been drafted to Group {target}!</strong>}
    </div>
  );
}