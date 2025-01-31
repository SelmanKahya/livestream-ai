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
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto p-4">
        <div className="bg-gray-800 rounded-lg shadow mb-8">
          <iframe
            src="/api/play-iframe"
            className="w-[500px] h-[500px] border-0 rounded-lg mx-auto block"
            title="Program Output"
          />
        </div>

        <h1 className="text-2xl font-bold mb-4 text-white">
          Program Iterations
        </h1>
        <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Iteration ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {iterations.map((iteration) => (
                <tr
                  key={iteration.id}
                  className="bg-gray-800 hover:bg-gray-700"
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
                      className={`px-4 py-2 rounded ${
                        selectedIteration === iteration.id
                          ? "bg-green-600 text-white"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {selectedIteration === iteration.id ? "Active" : "Select"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
