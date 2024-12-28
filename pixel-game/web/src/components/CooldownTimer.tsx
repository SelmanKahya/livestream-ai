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

  return (
    <div
      style={{
        padding: "8px 16px",
        backgroundColor: "#f0f0f0",
        borderRadius: "4px",
        fontWeight: "bold",
      }}
    >
      Wait {Math.ceil(timeLeft / 1000)}s
    </div>
  );
};
