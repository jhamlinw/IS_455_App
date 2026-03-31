"use client";

import { useState } from "react";
import Link from "next/link";

export default function ScoringPage() {
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function runScoring() {
    setStatus("running");
    setMessage("");

    try {
      const res = await fetch("/api/run-scoring", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Scoring failed");
        return;
      }

      setStatus("success");
      setMessage(
        `Scoring complete. ${data.count ?? "?"} orders scored at ${data.timestamp ?? new Date().toISOString()}`
      );
    } catch {
      setStatus("error");
      setMessage("Network error — could not reach the scoring endpoint.");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Run Scoring</h1>
      <p className="text-gray-600 mb-6">
        Click the button below to run the ML inference job. This scores all orders
        with the late-delivery model and writes predictions to the database. Afterwards,
        visit the{" "}
        <Link href="/warehouse/priority" className="text-indigo-600 hover:text-indigo-800">
          Priority Queue
        </Link>{" "}
        to see updated results.
      </p>

      <button
        onClick={runScoring}
        disabled={status === "running"}
        className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
      >
        {status === "running" ? "Running..." : "Run Scoring"}
      </button>

      {status === "success" && (
        <div className="mt-4 bg-green-50 border border-green-200 text-green-700 rounded p-3 text-sm">
          {message}
        </div>
      )}

      {status === "error" && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">
          {message}
        </div>
      )}
    </div>
  );
}
