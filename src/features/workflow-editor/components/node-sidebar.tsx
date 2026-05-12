"use client";

import { workflowNodeCategories, workflowNodeDefinitions } from "../catalog";
import type { WorkflowNodeKind } from "../types";

type NodeSidebarProps = {
  onAddNode: (kind: WorkflowNodeKind) => void;
};

function formatType(type: string) {
  return type.replace(/([A-Z])/g, " $1").toLowerCase();
}

export function NodeSidebar({ onAddNode }: NodeSidebarProps) {
  return (
    <aside className="w-80 border-r border-yellow-500/20 bg-zinc-950/95 p-5 text-zinc-100">
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-[0.24em] text-yellow-400 uppercase">
          Node Catalog
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white">
          Build workflow
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Add source, processing, output, and preview steps to the canvas.
        </p>
      </div>

      <div className="space-y-6">
        {workflowNodeCategories.map((category) => {
          const definitions = workflowNodeDefinitions.filter(
            (definition) => definition.category === category,
          );

          return (
            <section key={category}>
              <h3 className="mb-3 text-sm font-semibold text-yellow-300">
                {category}
              </h3>
              <div className="space-y-2">
                {definitions.map((definition) => (
                  <button
                    key={definition.kind}
                    type="button"
                    onClick={() => onAddNode(definition.kind)}
                    className="w-full rounded-xl border border-yellow-500/20 bg-zinc-900/80 p-3 text-left transition hover:border-yellow-400/70 hover:bg-yellow-400/10 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                  >
                    <span className="block text-sm font-semibold text-zinc-50">
                      {definition.label}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-zinc-400">
                      {definition.description}
                    </span>
                    <span className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-zinc-400">
                      {definition.inputTypes.length > 0 && (
                        <span className="rounded-full border border-zinc-700 px-2 py-1">
                          in: {definition.inputTypes.map(formatType).join(", ")}
                        </span>
                      )}
                      {definition.outputTypes.length > 0 && (
                        <span className="rounded-full border border-yellow-400/40 px-2 py-1 text-yellow-300">
                          out:{" "}
                          {definition.outputTypes.map(formatType).join(", ")}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </aside>
  );
}
