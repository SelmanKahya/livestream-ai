import React, { useEffect, useState } from "react";
import { PixelCanvas } from "./components/PixelCanvas";
import { ColorPicker } from "./components/ColorPicker";
import { CooldownTimer } from "./components/CooldownTimer";
import { CanvasState, COLORS } from "./types";
import { BACKEND_BASE_URL } from "./config";

const CANVAS_WIDTH = 50;
const CANVAS_HEIGHT = 50;
const PIXEL_SIZE = 12;
const COOLDOWN_PERIOD = 30000; // 30 seconds in milliseconds

function App() {
  const [selectedColor, setSelectedColor] = useState<string>(COLORS[0]);
  const [lastPlacedAt, setLastPlacedAt] = useState<number | null>(null);
  const [canPlace, setCanPlace] = useState<boolean>(true);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    pixels: [],
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  });

  useEffect(() => {
    const fetchCanvas = async () => {
      try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/canvas`);
        const data = await response.json();
        setCanvasState(data);
      } catch (error) {
        console.error("Failed to fetch canvas:", error);
      }
    };

    fetchCanvas();
    const interval = setInterval(fetchCanvas, 5000);
    return () => clearInterval(interval);
  }, []);

  const handlePixelPlace = async (x: number, y: number) => {
    if (!canPlace) return;

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/pixel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          x,
          y,
          color: selectedColor,
        }),
      });

      if (response.ok) {
        setLastPlacedAt(Date.now());
        setCanPlace(false);

        // Optimistically update the canvas
        setCanvasState((prev) => ({
          ...prev,
          pixels: [
            ...(prev.pixels?.filter((p) => p.x !== x || p.y !== y) || []),
            { x, y, color: selectedColor, timestamp: Date.now() },
          ],
        }));
      }
    } catch (error) {
      console.error("Failed to place pixel:", error);
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
      }}
    >
      <h1>Pixel Game</h1>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <ColorPicker
          selectedColor={selectedColor}
          onColorSelect={setSelectedColor}
        />
        <CooldownTimer
          lastPlacedAt={lastPlacedAt}
          cooldownPeriod={COOLDOWN_PERIOD}
          onCooldownEnd={() => setCanPlace(true)}
        />
      </div>

      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "4px",
          padding: "10px",
        }}
      >
        <PixelCanvas
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          pixelSize={PIXEL_SIZE}
          selectedColor={selectedColor}
          onPixelPlace={handlePixelPlace}
          canvasState={canvasState}
          canPlace={canPlace}
        />
      </div>
    </div>
  );
}

export default App;
