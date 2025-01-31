"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function IterationScreen() {
  const [timeLeft, setTimeLeft] = useState(120);
  const [iterationNumber, setIterationNumber] = useState(1);
  const [modificationRequest, setModificationRequest] = useState(
    "ADD ENEMY ATTACKING THE SNAKE"
  );
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestIteration = async () => {
      const { data, error } = await supabase
        .from("program_state")
        .select("current_iteration")
        .eq("id", 1)
        .single();

      if (error) {
        console.error("Error fetching iteration:", error);
        return;
      }

      if (data?.current_iteration) {
        setIterationNumber(data.current_iteration);
      }
    };

    fetchLatestIteration();
  }, []);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleSubmit = async () => {
    try {
      // Get the latest program state
      const { data: stateData, error: stateError } = await supabase
        .from("program_state")
        .select("current_iteration")
        .eq("id", 1)
        .single();

      if (stateError) {
        throw stateError;
      }

      if (!stateData?.current_iteration) {
        throw new Error("No current iteration found");
      }

      // Get user's session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) {
        throw sessionError;
      }

      if (!session?.user?.id) {
        throw new Error("No user session found");
      }

      // Insert the modification request
      const { error: insertError } = await supabase
        .from("program_input")
        .insert({
          input_text: modificationRequest,
          profile_id: session.user.id,
          iteration_id: stateData.current_iteration,
        });

      if (insertError) {
        throw insertError;
      }

      setIsSubmitted(true);
      setError(null);
    } catch (err) {
      console.error("Error submitting modification:", err);
      setError("Failed to submit modification. Please try again.");
      return;
    }
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
              {error && <div className="text-red-500 text-sm">{error}</div>}
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
