"use client";

import { useState, useEffect } from "react";

export default function IterationScreen() {
  const [timeLeft, setTimeLeft] = useState(120);
  const [iterationNumber, setIterationNumber] = useState(1);
  const [modificationRequest, setModificationRequest] = useState(
    "ADD ENEMY ATTACKING THE SNAKE"
  );
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl aspect-video">
        <div className="bg-transparent rounded-3xl p-12 flex flex-col items-center space-y-10 border border-zinc-800 relative h-full">
          {/* Iteration Number and Timer */}
          <div className="absolute top-8 right-8 text-right">
            <div className="text-2xl font-light">
              ITERATION #{iterationNumber}
            </div>
            <div className="text-xl font-light mt-2">{timeLeft} SECS LEFT</div>
          </div>

          {/* Modification Request Section */}
          <div className="flex flex-col items-center justify-center flex-grow w-full space-y-8">
            <div className="text-xl font-light text-zinc-400">
              YOUR MODIFICATION REQUEST:
            </div>
            <div className="w-full flex flex-col items-center gap-4">
              <input
                type="text"
                value={modificationRequest}
                onChange={(e) => setModificationRequest(e.target.value)}
                className="px-8 py-4 border border-zinc-800 rounded-full text-xl bg-transparent text-center w-full max-w-2xl disabled:opacity-50"
                placeholder="Enter your modification request..."
                disabled={isSubmitted}
              />
              <button
                onClick={handleSubmit}
                disabled={isSubmitted}
                className="px-8 py-3 border border-zinc-800 rounded-full text-lg
                         hover:bg-white hover:text-black disabled:opacity-50 
                         disabled:hover:bg-transparent disabled:hover:text-white
                         transition-all duration-200 ease-out"
              >
                {isSubmitted ? "SUBMITTED" : "SUBMIT"}
              </button>
            </div>
          </div>

          {/* Play Button */}
          <button
            className="absolute top-2 left-8 px-12 py-3 
                     border border-zinc-800 rounded-full text-lg
                     hover:bg-white hover:text-black
                     transition-all duration-200 ease-out"
          >
            PLAY
          </button>
        </div>
      </div>
    </div>
  );
}
