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
    <div className="min-h-screen bg-black text-gray-300">
      <div className="container mx-auto p-4 space-y-8">
        <div className="bg-gray-950 rounded-lg shadow-lg overflow-hidden border border-gray-800">
          <iframe
            src={`/api/play-iframe${
              selectedIteration ? `?iterationId=${selectedIteration}` : ""
            }`}
            className="w-full aspect-square max-h-[800px] border-0"
            title="Program Output"
          />
        </div>

        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-gray-200">
            Program Iterations
          </h1>
          <div className="bg-gray-950 rounded-lg shadow-lg overflow-hidden border border-gray-800">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-950">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Iteration ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {iterations.map((iteration) => (
                  <tr
                    key={iteration.id}
                    className="bg-gray-950 hover:bg-gray-900 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {iteration.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(iteration.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleIterationSelect(iteration.id)}
                        className={`px-4 py-2 rounded-md transition-colors ${
                          selectedIteration === iteration.id
                            ? "bg-emerald-950 hover:bg-emerald-900 text-emerald-200"
                            : "bg-indigo-950 hover:bg-indigo-900 text-indigo-200"
                        }`}
                      >
                        {selectedIteration === iteration.id
                          ? "Active"
                          : "Select"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
