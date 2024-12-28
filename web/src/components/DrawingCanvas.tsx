import React from "react";
import CanvasDraw from "react-canvas-draw";

interface DrawingCanvasProps {
  onSubmit: (imageData: string) => void;
  canvasSize?: number;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  onSubmit,
  canvasSize = 280,
}) => {
  const canvasRef = React.useRef<any>(null);

  const handleSubmit = () => {
    if (canvasRef.current) {
      // Get the canvas data
      const canvas = canvasRef.current.canvasContainer.children[1]; // This gets the drawing canvas
      const ctx = canvas.getContext("2d");
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Create a temporary canvas for processing
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = 28;
      tempCanvas.height = 28;
      const tempCtx = tempCanvas.getContext("2d");

      if (!tempCtx) {
        console.error("Could not get canvas context");
        return;
      }

      // Draw the original image scaled down to 28x28
      tempCtx.drawImage(
        canvas,
        0,
        0,
        canvas.width,
        canvas.height,
        0,
        0,
        28,
        28
      );

      // Get the scaled image data
      const scaledImageData = tempCanvas.toDataURL("image/png");

      onSubmit(scaledImageData);
      canvasRef.current.clear();
    }
  };

  const handleClear = () => {
    if (canvasRef.current) {
      canvasRef.current.clear();
    }
  };

  return (
    <div className="canvas-container">
      <div>
        <CanvasDraw
          ref={canvasRef}
          brushColor="#000000"
          brushRadius={18}
          canvasWidth={canvasSize}
          canvasHeight={canvasSize}
          hideGrid
          lazyRadius={0}
          style={{
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />
        <div className="button-container" style={{ marginTop: "1rem" }}>
          <button onClick={handleClear}>Clear</button>
          <button onClick={handleSubmit}>Submit</button>
        </div>
      </div>
    </div>
  );
};

export default DrawingCanvas;
