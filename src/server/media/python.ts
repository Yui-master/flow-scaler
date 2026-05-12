import "server-only";

import { spawn } from "node:child_process";
import path from "node:path";

export type RunRealEsrganInput = {
  inputPath: string;
  outputPath: string;
  model: string;
  scale: number;
};

export function runRealEsrgan(input: RunRealEsrganInput) {
  return new Promise<void>((resolve, reject) => {
    const pythonBin = process.env.PYTHON_BIN ?? "python";
    const scriptPath = path.join(process.cwd(), "workers", "gpu-worker", "run_realesrgan.py");
    const timeoutMs = Number(process.env.REALESRGAN_TIMEOUT_MS ?? 600_000);
    const child = spawn(
      pythonBin,
      [
        scriptPath,
        "--input",
        input.inputPath,
        "--output",
        input.outputPath,
        "--model",
        input.model,
        "--scale",
        String(input.scale),
      ],
      { shell: false },
    );

    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error(`RealESRGAN timed out after ${timeoutMs}ms.`));
    }, timeoutMs);

    child.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    child.on("close", (code) => {
      clearTimeout(timeout);

      if (code === 0) {
        resolve();
        return;
      }

      const details = stderr.trim() || stdout.trim() || `Python exited with code ${code}.`;
      reject(new Error(details));
    });
  });
}
