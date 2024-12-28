import React from "react";
import { COLORS } from "../types";

interface ColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onColorSelect,
}) => {
  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        maxWidth: "300px",
      }}
    >
      {COLORS.map((color) => (
        <div
          key={color}
          onClick={() => onColorSelect(color)}
          style={{
            width: "40px",
            height: "40px",
            backgroundColor: color,
            border:
              color === selectedColor ? "3px solid #000" : "1px solid #ccc",
            cursor: "pointer",
            borderRadius: "4px",
          }}
        />
      ))}
    </div>
  );
};
