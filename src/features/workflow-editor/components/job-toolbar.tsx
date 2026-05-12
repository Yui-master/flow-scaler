"use client";

import type { WorkflowGraphValidationError, WorkflowJobState } from "../types";

type JobToolbarJobState = Omit<WorkflowJobState, "id" | "errorMessage"> & {
  id: string | null;
  errorMessage: string | null;
};

type JobToolbarProps = {
  job: JobToolbarJobState;
  validationErrors: WorkflowGraphValidationError[];
  onStartJob: () => void;
  onReset: () => void;
};

function capitalizeStatus(status: WorkflowJobState["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function JobToolbar({
  job,
  validationErrors,
  onStartJob,
  onReset,
}: JobToolbarProps) {
  const progress = Math.min(100, Math.max(0, job.progress));

  return (
    <div className="flex flex-row flex-wrap items-center gap-3 text-zinc-100">
      {validationErrors.length > 0 && (
        <section
          aria-labelledby="workflow-validation-errors-heading"
          className="max-w-xl rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-100"
        >
          <h2
            id="workflow-validation-errors-heading"
            className="text-sm font-semibold text-red-200"
          >
            Fix before Start Job
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-100">
            {validationErrors.map((error) => (
              <li key={`${error.nodeId ?? "graph"}-${error.message}`}>
                {error.message}
              </li>
            ))}
          </ul>
        </section>
      )}

      {job.status !== "idle" && (
        <section
          aria-label="Workflow job status"
          aria-live="polite"
          className="min-w-56 rounded-2xl border border-yellow-500/20 bg-zinc-900/80 p-4"
        >
          <div className="flex items-center justify-between gap-4 text-sm font-semibold">
            <span className="text-white">{capitalizeStatus(job.status)}</span>
            <span className="text-yellow-300">{progress}%</span>
          </div>
          <div
            aria-label="Workflow job progress"
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={progress}
            className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-yellow-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          {job.status === "completed" && job.downloadUrl && (
            <a
              className="mt-3 inline-flex rounded-xl border border-yellow-400/50 px-3 py-2 text-sm font-semibold text-yellow-200 transition hover:bg-yellow-400/10"
              href={job.downloadUrl}
            >
              Download output
            </a>
          )}
        </section>
      )}

      <div className="ml-auto flex flex-row items-center gap-3">
        <button
          type="button"
          onClick={onStartJob}
          className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-yellow-300 focus:ring-2 focus:ring-yellow-200 focus:outline-none"
        >
          Start Job
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-xl border border-yellow-400/40 bg-zinc-900 px-4 py-2 text-sm font-semibold text-yellow-200 transition hover:border-yellow-300 hover:bg-yellow-400/10 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
        >
          Reset sample
        </button>
      </div>
    </div>
  );
}
