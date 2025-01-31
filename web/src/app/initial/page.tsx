"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [idea, setIdea] = useState("");
  const router = useRouter();

  const handleContinue = () => {
    router.push("/iteration");
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
