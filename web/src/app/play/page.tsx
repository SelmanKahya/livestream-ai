import React from "react";

export const revalidate = 0;

export default async function PlayPage() {
  return (
    <iframe
      src="/api/play-iframe"
      className="w-full h-screen border-0"
      title="Program Output"
    />
  );
}
