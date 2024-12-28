import React from "react";
import DrawingCanvas from "./DrawingCanvas";
import axios from "axios";
import { BACKEND_BASE_URL } from "../config";

interface TestingFlowProps {
  onComplete: () => void;
}

interface PredictionResult {
  prediction: number;
  confidence: number;
}

const TestingFlow: React.FC<TestingFlowProps> = ({ onComplete }) => {
  const [result, setResult] = React.useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (imageData: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post<PredictionResult>(
        `${BACKEND_BASE_URL}/guess`,
        {
          imageData,
        }
      );
      setResult(response.data);
    } catch (error) {
      console.error("Error getting prediction:", error);
      alert("Failed to get prediction. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryAgain = () => {
    setResult(null);
  };

  return (
    <div className="testing-flow">
      <h2>Testing Mode</h2>
      {!result ? (
        <>
          <p>Draw any digit (0-9)</p>
          <DrawingCanvas onSubmit={handleSubmit} />
          {isLoading && <p>Getting prediction...</p>}
        </>
      ) : (
        <div className="result-container">
          <h3>Result</h3>
          <p className="prediction">Predicted Digit: {result.prediction}</p>
          <p className="confidence">
            Confidence: {(result.confidence * 100).toFixed(2)}%
          </p>
          <div className="button-container">
            <button onClick={handleTryAgain}>Try Again</button>
            <button onClick={onComplete}>Back to Main</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestingFlow;
