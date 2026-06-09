"use client";

import { useEffect, useRef } from "react";

const WORDS = [
  "O.V.", "Til'", "Anatoly Kurochkin", "Vidik", "Suntech",
  "Plast", "Klew", "Kasper", "Abram", "Kisliy",
  "4erniy", "Agafon", "Mazik", "Kolod", "Aidarik",
  "Nikita Kontorcev", "Garik", "Dolina", "Laeva", "Samokat",
  "Parax", "Baragozin", "Suchcock", "Baha", "Ferruz",
];

const SIZES    = [168, 140, 119, 102, 87, 76, 65];
const MIN_SIZE = 52;
const PAD_X    = 6;
const PAD_Y    = 4;
const SPEED    = 2.0;
const RESTITUTION = 0.82;

const COLORS = [
  "#F0C060", "#E8B84B", "#C68F2E", "#D4A843",
  "#B87D35", "#DAA520", "#CD853F", "#F5D78E",
  "#A07828", "#FFD060",
];

function getFont(sz: number) {
  return `300 ${sz}px "Segoe UI", system-ui, sans-serif`;
}

export function TagCloudBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId: number;
    let cleanupFn: (() => void) | null = null;

    import("matter-js").then(({ Engine, Bodies, Body, World, Runner }) => {
      if (!canvas) return;
      const el  = canvas as HTMLCanvasElement;
      const ctx = el.getContext("2d")!;
      const dpr = window.devicePixelRatio || 1;
      let W = window.innerWidth;
      let H = window.innerHeight;

      function resizeCanvas() {
        el.width        = W * dpr;
        el.height       = H * dpr;
        el.style.width  = W + "px";
        el.style.height = H + "px";
        ctx.scale(dpr, dpr);
      }
      resizeCanvas();

      const engine = Engine.create({ gravity: { x: 0, y: 0 } });
      const world  = engine.world;

      let walls: Matter.Body[] = [];
      function makeWalls() {
        walls.forEach((w) => World.remove(world, w));
        const T = 60;
        walls = [
          Bodies.rectangle(W / 2,  -T / 2,  W + 120, T,       { isStatic: true }),
          Bodies.rectangle(W / 2, H + T / 2, W + 120, T,       { isStatic: true }),
          Bodies.rectangle(-T / 2,  H / 2,  T,       H + 120, { isStatic: true }),
          Bodies.rectangle(W + T / 2, H / 2, T,       H + 120, { isStatic: true }),
        ];
        World.add(world, walls);
      }
      makeWalls();

      const scale = W < 768 ? 0.25 : 1;

      function getSize(i: number) {
        const base = i < SIZES.length ? SIZES[i] : MIN_SIZE;
        return Math.round(base * scale);
      }

      function measure(text: string, sz: number) {
        ctx.font = getFont(sz);
        return {
          w: ctx.measureText(text).width + PAD_X * 2,
          h: sz + PAD_Y * 2,
        };
      }

      const tags = WORDS.map((word, i) => {
        const sz       = getSize(i);
        const { w, h } = measure(word, sz);
        const color    = COLORS[i % COLORS.length];

        const x = w / 2 + 10 + Math.random() * Math.max(0, W - w - 20);
        const y = h / 2 + 10 + Math.random() * Math.max(0, H - h - 20);

        const body = Bodies.rectangle(x, y, w, h, {
          restitution: RESTITUTION,
          friction: 0,
          frictionAir: 0,
          inertia: Infinity,
          inverseInertia: 0,
        });

        const a = Math.random() * Math.PI * 2;
        Body.setVelocity(body, { x: Math.cos(a) * SPEED, y: Math.sin(a) * SPEED });

        return { body, word, sz, w, h, color };
      });

      World.add(world, tags.map((t) => t.body));

      const mouse = { x: -9999, y: -9999 };
      function onMouseMove(e: MouseEvent) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      }
      window.addEventListener("mousemove", onMouseMove);

      function onResize() {
        W = window.innerWidth;
        H = window.innerHeight;
        resizeCanvas();
        makeWalls();
      }
      window.addEventListener("resize", onResize);

      function draw() {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, W, H);

        tags.forEach((tag) => {
          const { x, y } = tag.body.position;
          const hw = tag.w / 2, hh = tag.h / 2;
          const hovered =
            mouse.x >= x - hw && mouse.x <= x + hw &&
            mouse.y >= y - hh && mouse.y <= y + hh;

          ctx.save();
          ctx.translate(x, y);
          if (hovered) ctx.scale(1.08, 1.08);

          ctx.font         = getFont(tag.sz);
          ctx.textAlign    = "center";
          ctx.textBaseline = "middle";
          ctx.shadowColor  = tag.color;
          ctx.shadowBlur   = hovered ? 22 : 0;
          ctx.fillStyle    = hovered ? "#fff" : tag.color;
          ctx.fillText(tag.word, 0, 0);

          ctx.restore();
        });
      }

      function maintainSpeed() {
        tags.forEach((tag) => {
          const v   = tag.body.velocity;
          const spd = Math.hypot(v.x, v.y);
          if (spd < 0.4) {
            const a = Math.random() * Math.PI * 2;
            Body.setVelocity(tag.body, { x: Math.cos(a) * SPEED, y: Math.sin(a) * SPEED });
          } else if (spd > SPEED * 3.5) {
            const k = (SPEED * 3.5) / spd;
            Body.setVelocity(tag.body, { x: v.x * k, y: v.y * k });
          }
        });
      }

      const runner = Runner.create();
      Runner.run(runner, engine);

      function loop() {
        maintainSpeed();
        draw();
        animId = requestAnimationFrame(loop);
      }
      loop();

      cleanupFn = () => {
        cancelAnimationFrame(animId);
        Runner.stop(runner);
        World.clear(world, false);
        Engine.clear(engine);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("resize", onResize);
      };
    });

    return () => cleanupFn?.();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
