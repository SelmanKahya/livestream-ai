import React, { useEffect, useRef, useState } from "react";
import { CanvasState, Pixel } from "../types";

interface PixelCanvasProps {
  width: number;
  height: number;
  pixelSize: number;
  selectedColor: string;
  onPixelPlace: (x: number, y: number) => void;
  canvasState: CanvasState;
  canPlace: boolean;
}

export const PixelCanvas: React.FC<PixelCanvasProps> = ({
  width,
  height,
  pixelSize,
  selectedColor,
  onPixelPlace,
  canvasState,
  canPlace,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = "#CCCCCC";
    ctx.lineWidth = 1;

    // Draw vertical lines
    for (let x = 0; x <= width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * pixelSize, 0);
      ctx.lineTo(x * pixelSize, height * pixelSize);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y <= height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * pixelSize);
      ctx.lineTo(width * pixelSize, y * pixelSize);
      ctx.stroke();
    }
  };

  const drawPixels = (ctx: CanvasRenderingContext2D) => {
    if (!canvasState?.pixels) return;
    canvasState.pixels.forEach((pixel) => {
      ctx.fillStyle = pixel.color;
      ctx.fillRect(
        pixel.x * pixelSize,
        pixel.y * pixelSize,
        pixelSize,
        pixelSize
      );
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Always start with a white background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width * pixelSize, height * pixelSize);

    // Draw pixels and grid
    drawPixels(ctx);
    drawGrid(ctx);
  }, [canvasState, width, height, pixelSize]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canPlace) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / pixelSize);
    const y = Math.floor((event.clientY - rect.top) / pixelSize);

    if (x >= 0 && x < width && y >= 0 && y < height) {
      onPixelPlace(x, y);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={width * pixelSize}
      height={height * pixelSize}
      onClick={handleCanvasClick}
      style={{ cursor: canPlace ? "pointer" : "not-allowed" }}
    />
  );
};
