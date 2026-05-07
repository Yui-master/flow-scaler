"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

import type { WorkflowNode } from "../types";

const categoryStyles = {
  Input: "border-emerald-400/50 bg-emerald-400/10 text-emerald-200",
  Processing: "border-yellow-400/50 bg-yellow-400/10 text-yellow-100",
  Output: "border-sky-400/50 bg-sky-400/10 text-sky-100",
  Preview: "border-fuchsia-400/50 bg-fuchsia-400/10 text-fuchsia-100",
} as const;

const statusStyles = {
  idle: "bg-zinc-700 text-zinc-200",
  queued: "bg-blue-500/20 text-blue-200",
  running: "bg-yellow-500/20 text-yellow-100",
  completed: "bg-emerald-500/20 text-emerald-200",
  failed: "bg-red-500/20 text-red-200",
} as const;

export function WorkflowNode({ data, selected }: NodeProps<WorkflowNode>) {
  return (
    <div
      className={`min-w-64 rounded-2xl border bg-zinc-950/95 p-4 shadow-2xl shadow-black/30 ${
        selected ? "border-yellow-300" : "border-yellow-500/25"
      }`}
    >
      {data.inputTypes.length > 0 && (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-3 !w-3 !border-2 !border-zinc-950 !bg-yellow-300"
        />
      )}

      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-yellow-400 uppercase">
            {data.category}
          </p>
          <h3 className="mt-1 text-base font-semibold text-white">
            {data.label}
          </h3>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${statusStyles[data.status]}`}
        >
          {data.status}
        </span>
      </div>

      <div className="mb-3">
        <span
          className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${categoryStyles[data.category]}`}
        >
          {data.kind}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="mb-1 font-semibold text-zinc-400">Inputs</p>
          <div className="flex flex-wrap gap-1">
            {data.inputTypes.length > 0 ? (
              data.inputTypes.map((type) => (
                <TypeBadge key={type} label={type} />
              ))
            ) : (
              <span className="text-zinc-500">None</span>
            )}
          </div>
        </div>
        <div>
          <p className="mb-1 font-semibold text-zinc-400">Outputs</p>
          <div className="flex flex-wrap gap-1">
            {data.outputTypes.length > 0 ? (
              data.outputTypes.map((type) => (
                <TypeBadge key={type} label={type} />
              ))
            ) : (
              <span className="text-zinc-500">None</span>
            )}
          </div>
        </div>
      </div>

      {data.outputTypes.length > 0 && (
        <Handle
          type="source"
          position={Position.Right}
          className="!h-3 !w-3 !border-2 !border-zinc-950 !bg-yellow-300"
        />
      )}
    </div>
  );
}

function TypeBadge({ label }: { label: string }) {
  return (
    <span className="rounded-md border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300">
      {label}
    </span>
  );
}
