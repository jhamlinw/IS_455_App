import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";

export async function POST() {
  const scriptPath = path.join(process.cwd(), "jobs", "run_inference.py");

  return new Promise<NextResponse>((resolve) => {
    exec(
      `python "${scriptPath}"`,
      { cwd: process.cwd(), timeout: 60000 },
      (error, stdout, stderr) => {
        if (error) {
          const msg = stderr || error.message || "Inference script failed";
          resolve(
            NextResponse.json({ error: msg }, { status: 500 })
          );
          return;
        }

        try {
          const result = JSON.parse(stdout.trim());
          resolve(NextResponse.json(result));
        } catch {
          resolve(
            NextResponse.json(
              { count: null, timestamp: new Date().toISOString(), raw: stdout.trim() },
              { status: 200 }
            )
          );
        }
      }
    );
  });
}
