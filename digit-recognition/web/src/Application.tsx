import React from "react";
import "./App.css";
import "./styles/theme.css";
import TrainingFlow from "./components/TrainingFlow";
import TestingFlow from "./components/TestingFlow";
import { useTheme } from "./contexts/ThemeContext";

enum Screen {
  MAIN = "MAIN",
  TRAIN = "TRAIN",
  TEST = "TEST",
}

function Application() {
  const [currentScreen, setCurrentScreen] = React.useState<Screen>(Screen.MAIN);
  const { theme, toggleTheme } = useTheme();

  const handleTrainClick = () => {
    setCurrentScreen(Screen.TRAIN);
  };

  const handleTestClick = () => {
    setCurrentScreen(Screen.TEST);
  };

  const handleBackToMain = () => {
    setCurrentScreen(Screen.MAIN);
  };

  return (
    <div className="App">
      <button
        onClick={toggleTheme}
        className="theme-toggle"
        style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          padding: "0.5rem 1rem",
          borderRadius: "4px",
        }}
      >
        {theme === "light" ? "🌙" : "☀️"}
      </button>

      {currentScreen === Screen.MAIN && (
        <div className="main-screen">
          <h1>Number Recognition AI</h1>
          <div className="button-container">
            <button onClick={handleTrainClick}>TRAIN</button>
            <button onClick={handleTestClick}>TEST</button>
          </div>
        </div>
      )}

      {currentScreen === Screen.TRAIN && (
        <TrainingFlow onComplete={handleBackToMain} />
      )}

      {currentScreen === Screen.TEST && (
        <TestingFlow onComplete={handleBackToMain} />
      )}
    </div>
  );
}

export default Application;
