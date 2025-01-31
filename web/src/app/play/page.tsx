"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface ProgramCode {
  id: number;
  code: string;
  created_at: string;
}

export default function PlayPage() {
  const [iterations, setIterations] = useState<ProgramCode[]>([]);
  const [selectedIteration, setSelectedIteration] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIterations();
    fetchCurrentIteration();

    // Set up polling interval for iterations
    const pollingInterval = setInterval(() => {
      fetchIterations();
    }, 30000); // 30 seconds

    // Add global event listener for arrow keys
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearInterval(pollingInterval); // Clean up interval on unmount
    };
  }, []);

  const fetchIterations = async () => {
    const { data, error } = await supabase
      .from("program_code")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching iterations:", error);
      return;
    }

    setIterations(data || []);
    setLoading(false);
  };

  const fetchCurrentIteration = async () => {
    const { data, error } = await supabase
      .from("program_state")
      .select("current_iteration")
      .eq("id", 1)
      .single();

    if (error) {
      console.error("Error fetching current iteration:", error);
      return;
    }

    setSelectedIteration(data?.current_iteration || null);
  };

  const handleIterationSelect = async (iterationId: number) => {
    setSelectedIteration(iterationId);

    const { error } = await supabase
      .from("program_state")
      .update({ current_iteration: iterationId })
      .eq("id", 1);

    if (error) {
      console.error("Error updating current iteration:", error);
      setSelectedIteration(null);
      return;
    }
  };

  if (loading) {
    return <div className="p-4 text-white">Loading iterations...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-gray-300 relative">
      <div className="fixed inset-0">
        <div
          tabIndex={0}
          onKeyDown={(e) => {
            if (
              ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
                e.key
              )
            ) {
              e.preventDefault();
            }
          }}
          className="w-full h-full"
        >
          <iframe
            src={`/api/play-iframe${
              selectedIteration ? `?iterationId=${selectedIteration}` : ""
            }`}
            className="w-full h-full border-0"
            title="Program Output"
          />
        </div>
      </div>

      <div className="absolute top-16 right-4 z-10 w-80">
        <select
          value={selectedIteration || ""}
          onChange={(e) => handleIterationSelect(Number(e.target.value))}
          className="w-full bg-gray-900/90 backdrop-blur text-gray-300 px-4 py-2 rounded-md border border-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select an iteration</option>
          {iterations.map((iteration) => (
            <option key={iteration.id} value={iteration.id}>
              Iteration {iteration.id} -{" "}
              {new Date(iteration.created_at).toLocaleString()}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
