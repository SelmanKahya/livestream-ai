import React, { useEffect, useState } from "react";

interface CooldownTimerProps {
  lastPlacedAt: number | null;
  cooldownPeriod: number;
  onCooldownEnd: () => void;
}

export const CooldownTimer: React.FC<CooldownTimerProps> = ({
  lastPlacedAt,
  cooldownPeriod,
  onCooldownEnd,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!lastPlacedAt) {
      setTimeLeft(0);
      return;
    }

    const calculateTimeLeft = () => {
      const now = Date.now();
      const timeSincePlaced = now - lastPlacedAt;
      const remaining = Math.max(0, cooldownPeriod - timeSincePlaced);

      setTimeLeft(remaining);

      if (remaining === 0) {
        onCooldownEnd();
      }

      return remaining;
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 100);

    return () => clearInterval(interval);
  }, [lastPlacedAt, cooldownPeriod, onCooldownEnd]);

  if (timeLeft === 0) return null;

  const secondsLeft = Math.ceil(timeLeft / 1000);

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        padding: "12px 24px",
        backgroundColor: "#333",
        color: "white",
        borderRadius: "8px",
        fontWeight: "bold",
        fontSize: "18px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        zIndex: 1000,
      }}
    >
      {secondsLeft} saniye kaldı
    </div>
  );
};
