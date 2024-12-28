export type Pixel = {
  x: number;
  y: number;
  color: string;
  timestamp: number;
};

export type CanvasState = {
  pixels: Pixel[];
  width: number;
  height: number;
};

export const COLORS = [
  "#FF0000", // Red
  "#00FF00", // Green
  "#0000FF", // Blue
  "#FFFF00", // Yellow
  "#FF00FF", // Magenta
  "#00FFFF", // Cyan
  "#FFA500", // Orange
  "#800080", // Purple
  "#008000", // Dark Green
  "#000000", // Black
  "#FFFFFF", // White
  "#808080", // Gray
];
