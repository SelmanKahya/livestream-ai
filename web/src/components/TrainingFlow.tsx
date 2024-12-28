import React from "react";
import DrawingCanvas from "./DrawingCanvas";
import axios from "axios";
import { BACKEND_BASE_URL } from "../config";

interface TrainingFlowProps {
  onComplete: () => void;
}

const TrainingFlow: React.FC<TrainingFlowProps> = ({ onComplete }) => {
  const [currentDigit, setCurrentDigit] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (imageData: string) => {
    setIsLoading(true);
    try {
      await axios.post(`${BACKEND_BASE_URL}/train`, {
        digit: currentDigit,
        imageData,
      });

      if (currentDigit < 9) {
        setCurrentDigit((prev) => prev + 1);
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
      <p className="progress">Progress: {currentDigit + 1}/10</p>
      <DrawingCanvas onSubmit={handleSubmit} />
      {isLoading && <p>Submitting...</p>}
    </div>
  );
};

export default TrainingFlow;
