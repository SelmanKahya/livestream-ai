import React from "react";
import DrawingCanvas from "./DrawingCanvas";
import axios from "axios";
import { BACKEND_BASE_URL } from "../config";

interface TrainingFlowProps {
  onComplete: () => void;
}

const TrainingFlow: React.FC<TrainingFlowProps> = ({ onComplete }) => {
  const [remainingDigits, setRemainingDigits] = React.useState<number[]>(() => {
    // Initialize with shuffled array of digits 0-9
    return Array.from({ length: 10 }, (_, i) => i).sort(
      () => Math.random() - 0.5
    );
  });
  const [isLoading, setIsLoading] = React.useState(false);

  const currentDigit = remainingDigits[0];

  const handleSubmit = async (imageData: string) => {
    setIsLoading(true);
    try {
      await axios.post(`${BACKEND_BASE_URL}/train`, {
        digit: currentDigit,
        imageData,
      });

      if (remainingDigits.length > 1) {
        setRemainingDigits((prev) => prev.slice(1));
      } else {
        onComplete();
      }
    } catch (error) {
      console.error("Error submitting training data:", error);
      alert("Failed to submit training data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="training-flow">
      <h2>Training Mode</h2>
      <p>Draw digit: {currentDigit}</p>
      <p className="progress">Progress: {10 - remainingDigits.length + 1}/10</p>
      <DrawingCanvas onSubmit={handleSubmit} />
      {isLoading && <p>Submitting...</p>}
    </div>
  );
};

export default TrainingFlow;
