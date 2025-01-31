"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [idea, setIdea] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleContinue = async () => {
    if (!idea.trim()) {
      setError("Please enter an idea first");
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/"); // Redirect to auth page if not logged in
        return;
      }

      const { error: insertError } = await supabase
        .from("program_input")
        .insert({
          input_text: idea,
          profile_id: user.id,
        });

      if (insertError) {
        throw insertError;
      }

      router.push("/iteration");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save your idea");
      console.error("Error saving idea:", err);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="bg-black/50 rounded-2xl p-12 flex flex-col items-center space-y-10 border-zinc-800">
          <div className="w-full space-y-6 flex flex-col items-center">
            <label
              htmlFor="idea"
              className="text-lg font-extralight tracking-wide text-zinc-400"
            >
              What&apos;s on your mind?
            </label>
            <input
              id="idea"
              type="text"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              className="w-full px-6 py-4 bg-black border border-zinc-800 rounded-xl text-center text-lg 
                focus:outline-none focus:border-zinc-700
                transition-all duration-200 ease-out placeholder:text-zinc-700"
              placeholder="Type your idea here..."
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleContinue}
              className="mt-8 px-10 py-4 bg-white text-black rounded-xl
                hover:opacity-90 active:scale-[0.98]
                transition-all duration-200 ease-out font-light"
            >
              Continue →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
