"use client";

import Image from "next/image";
import { type RefObject, useRef } from "react";
import { type ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import type { ComicPage } from "@/types/content";
import { detectSwipe, type Point, type SwipeDirection } from "./swipe";

type Props = {
  page: ComicPage;
  zoomRef: RefObject<ReactZoomPanPinchRef | null>;
  scale: number;
  onScaleChange: (scale: number) => void;
  onSwipe: (direction: SwipeDirection) => void;
};

export function ReaderStage({ page, zoomRef, scale, onScaleChange, onSwipe }: Props) {
  const start = useRef<Point | null>(null);

  return (
    <div
      data-testid="reader-stage"
      className="h-full w-full touch-none overflow-hidden rounded-lg border border-reader-border bg-reader-stage"
      onTouchStart={(event) => {
        const touch = event.touches[0];
        start.current = event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null;
      }}
      onTouchMove={(event) => {
        if (event.touches.length > 1) start.current = null; // a pinch is not a swipe
      }}
      onTouchEnd={(event) => {
        const origin = start.current;
        start.current = null;
        if (!origin) return;
        const touch = event.changedTouches[0];
        const direction = detectSwipe(origin, { x: touch.clientX, y: touch.clientY }, scale);
        if (direction) onSwipe(direction);
      }}
    >
      <TransformWrapper
        key={page.id}
        ref={zoomRef}
        minScale={1}
        maxScale={4}
        doubleClick={{ mode: "toggle", step: 1.5 }}
        wheel={{ step: 0.15 }}
        panning={{ disabled: scale <= 1, velocityDisabled: true }}
        onTransform={(_ref, state) => onScaleChange(state.scale)}
      >
        <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%" }}>
          <Image
            src={page.imageUrl}
            alt={page.alt ?? ""}
            width={page.width}
            height={page.height}
            loading="eager"
            fetchPriority="high"
            sizes="100vw"
            draggable={false}
            className="h-full w-full object-contain"
          />
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}
