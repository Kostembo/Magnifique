"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface Props {
  src: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

type Interaction =
  | { kind: "drag"; px: number; py: number; ox: number; oy: number }
  | { kind: "resize"; corner: "tl" | "tr" | "bl" | "br"; ax: number; ay: number };

const MIN_SIZE = 60;

export function ImageCropModal({ src, onConfirm, onCancel }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const imgBounds = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const cropState = useRef({ x: 0, y: 0, size: 0 });
  const inter = useRef<Interaction | null>(null);

  const [crop, setCrop] = useState({ x: 0, y: 0, size: 0 });
  const [ready, setReady] = useState(false);
  const [processing, setProcessing] = useState(false);

  function applyBounds(x: number, y: number, size: number) {
    const b = imgBounds.current;
    const s = Math.max(MIN_SIZE, Math.min(size, b.w, b.h));
    const nx = Math.max(b.x, Math.min(b.x + b.w - s, x));
    const ny = Math.max(b.y, Math.min(b.y + b.h - s, y));
    cropState.current = { x: nx, y: ny, size: s };
    setCrop({ x: nx, y: ny, size: s });
  }

  function onImgLoad() {
    if (!imgRef.current || !containerRef.current) return;
    const img = imgRef.current;
    const cr = containerRef.current.getBoundingClientRect();
    const cw = cr.width;
    const ch = cr.height;

    // Вычисляем реальные размеры отрисованного изображения (object-contain)
    const ar = img.naturalWidth / img.naturalHeight;
    let rw: number, rh: number, ox: number, oy: number;
    if (ar > cw / ch) {
      rw = cw; rh = cw / ar; ox = 0; oy = (ch - rh) / 2;
    } else {
      rh = ch; rw = ch * ar; oy = 0; ox = (cw - rw) / 2;
    }
    imgBounds.current = { x: ox, y: oy, w: rw, h: rh };
    const size = Math.round(Math.min(rw, rh) * 0.85);
    applyBounds(ox + (rw - size) / 2, oy + (rh - size) / 2, size);
    setReady(true);
  }

  function relativePos(e: React.PointerEvent) {
    const cr = containerRef.current!.getBoundingClientRect();
    return { rx: e.clientX - cr.left, ry: e.clientY - cr.top };
  }

  function captureOnContainer(e: React.PointerEvent) {
    containerRef.current?.setPointerCapture(e.pointerId);
  }

  function onDragStart(e: React.PointerEvent) {
    e.stopPropagation();
    captureOnContainer(e);
    const { x, y } = cropState.current;
    inter.current = { kind: "drag", px: e.clientX, py: e.clientY, ox: x, oy: y };
  }

  function onResizeStart(corner: "tl" | "tr" | "bl" | "br") {
    return (e: React.PointerEvent) => {
      e.stopPropagation();
      captureOnContainer(e);
      const { x, y, size } = cropState.current;
      // anchor = противоположный угол
      const ax = corner.endsWith("l") ? x + size : x;
      const ay = corner.startsWith("t") ? y + size : y;
      inter.current = { kind: "resize", corner, ax, ay };
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    const it = inter.current;
    if (!it) return;

    if (it.kind === "drag") {
      const dx = e.clientX - it.px;
      const dy = e.clientY - it.py;
      applyBounds(it.ox + dx, it.oy + dy, cropState.current.size);
      return;
    }

    const { rx, ry } = relativePos(e);
    const { corner, ax, ay } = it;
    const b = imgBounds.current;

    const dx = corner.endsWith("r") ? rx - ax : ax - rx;
    const dy = corner.startsWith("b") ? ry - ay : ay - ry;
    const maxW = corner.endsWith("r") ? b.x + b.w - ax : ax - b.x;
    const maxH = corner.startsWith("b") ? b.y + b.h - ay : ay - b.y;
    const newSize = Math.max(MIN_SIZE, Math.min(dx, dy, maxW, maxH));
    const nx = corner.endsWith("r") ? ax : ax - newSize;
    const ny = corner.startsWith("b") ? ay : ay - newSize;
    applyBounds(nx, ny, newSize);
  }

  function onPointerUp() { inter.current = null; }

  async function handleConfirm() {
    if (!imgRef.current) return;
    setProcessing(true);
    try {
      const img = imgRef.current;
      const b = imgBounds.current;
      const { x, y, size } = cropState.current;
      const scaleX = img.naturalWidth / b.w;
      const scaleY = img.naturalHeight / b.h;

      const canvas = document.createElement("canvas");
      canvas.width = 400; canvas.height = 400;
      canvas.getContext("2d")!.drawImage(
        img,
        (x - b.x) * scaleX, (y - b.y) * scaleY,
        size * scaleX, size * scaleY,
        0, 0, 400, 400
      );
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (result) => (result ? resolve(result) : reject(new Error("toBlob failed"))),
          "image/webp", 0.85
        )
      );
      onConfirm(blob);
    } finally {
      setProcessing(false);
    }
  }

  const corners = [
    { id: "tl" as const, pos: { top: -8, left: -8 },    cursor: "nwse-resize", border: "border-t-2 border-l-2" },
    { id: "tr" as const, pos: { top: -8, right: -8 },   cursor: "nesw-resize", border: "border-t-2 border-r-2" },
    { id: "bl" as const, pos: { bottom: -8, left: -8 }, cursor: "nesw-resize", border: "border-b-2 border-l-2" },
    { id: "br" as const, pos: { bottom: -8, right: -8 }, cursor: "nwse-resize", border: "border-b-2 border-r-2" },
  ];

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="max-w-sm sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Выберите область фото</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">
          Перетащите рамку · потяните угол чтобы изменить размер
        </p>

        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-lg bg-black select-none"
          style={{ height: 360 }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={src}
            alt=""
            className="w-full h-full object-contain"
            onLoad={onImgLoad}
            draggable={false}
          />

          {ready && (
            <>
              <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
                <defs>
                  <mask id="crop-hole">
                    <rect width="100%" height="100%" fill="white" />
                    <rect x={crop.x} y={crop.y} width={crop.size} height={crop.size} rx="2" fill="black" />
                  </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask="url(#crop-hole)" />
              </svg>

              <div
                className="absolute border border-white cursor-move touch-none"
                style={{ left: crop.x, top: crop.y, width: crop.size, height: crop.size }}
                onPointerDown={onDragStart}
              >
                {/* Сетка по правилу третей */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-30"
                  style={{
                    backgroundImage: "linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)",
                    backgroundSize: "33.33% 33.33%",
                  }}
                />

                {/* Угловые ручки изменения размера */}
                {corners.map(({ id, pos, cursor, border }) => (
                  <div
                    key={id}
                    className="absolute w-6 h-6 touch-none"
                    style={{ ...pos, cursor }}
                    onPointerDown={onResizeStart(id)}
                  >
                    <div className={`absolute inset-0 border-white ${border}`} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={processing}>Отмена</Button>
          <Button onClick={handleConfirm} disabled={!ready || processing}>
            {processing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Применить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
