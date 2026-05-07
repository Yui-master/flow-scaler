import type {
  WorkflowEdge,
  WorkflowGraphValidationError,
  WorkflowNode,
  WorkflowNodeStatus,
} from "./types";
import { validateWorkflowConnection } from "./validation";

export type WorkflowJobValidationResult =
  | { valid: true }
  | { valid: false; errors: WorkflowGraphValidationError[] };

export type WorkflowJobLifecycleStep = {
  nodeId: string;
  status: Exclude<WorkflowNodeStatus, "idle" | "failed">;
  progress: number;
};

const lifecycleProgress = [10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 98, 99, 99, 99, 100];
const lifecycleStatuses: WorkflowJobLifecycleStep["status"][] = [
  "queued",
  "running",
  "completed",
];

export function validateWorkflowForJobStart(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
): WorkflowJobValidationResult {
  const errors: WorkflowGraphValidationError[] = [];

  for (const node of nodes) {
    if (node.data.kind === "loadVideo") {
      const asset = node.data.params.asset;
      if (asset?.kind !== "video" || asset.mimeType !== "video/mp4") {
        errors.push({
          nodeId: node.id,
          message: "Load Video needs an uploaded MP4 file.",
        });
      }
    }

    if (node.data.kind === "loadImage") {
      const asset = node.data.params.asset;
      if (
        asset?.kind !== "image" ||
        !["image/png", "image/jpeg"].includes(asset.mimeType)
      ) {
        errors.push({
          nodeId: node.id,
          message: "Load Image needs an uploaded PNG or JPG file.",
        });
      }
    }

    if (node.data.kind === "realesrganUpscale") {
      const model = node.data.params.model;
      if (typeof model !== "string" || model.trim() === "") {
        errors.push({
          nodeId: node.id,
          message: "RealESRGAN Upscale needs a model preset.",
        });
      }
    }
  }

  for (const edge of edges) {
    const result = validateWorkflowConnection(
      { source: edge.source, target: edge.target },
      nodes,
      edges.filter((candidate) => candidate.id !== edge.id),
    );

    if (!result.valid) {
      errors.push({ message: result.reason });
    }
  }

  const hasConnectedExport = nodes.some(
    (node) =>
      node.data.kind === "exportFile" &&
      edges.some((edge) => edge.target === node.id),
  );

  if (!hasConnectedExport) {
    errors.push({ message: "Workflow needs a connected Export File output." });
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true };
}

export function createJobLifecycleSteps(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
): WorkflowJobLifecycleStep[] {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const incomingCount = new Map(nodes.map((node) => [node.id, 0]));
  const outgoing = new Map<string, string[]>();

  for (const edge of edges) {
    incomingCount.set(edge.target, (incomingCount.get(edge.target) ?? 0) + 1);
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target]);
  }

  const queue = nodes
    .filter((node) => (incomingCount.get(node.id) ?? 0) === 0)
    .map((node) => node.id);
  const ordered: string[] = [];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (!nodeById.has(nodeId) || ordered.includes(nodeId)) {
      continue;
    }

    ordered.push(nodeId);

    for (const targetId of outgoing.get(nodeId) ?? []) {
      const nextIncomingCount = (incomingCount.get(targetId) ?? 0) - 1;
      incomingCount.set(targetId, nextIncomingCount);
      if (nextIncomingCount === 0) {
        queue.push(targetId);
      }
    }
  }

  for (const node of nodes) {
    if (!ordered.includes(node.id)) {
      ordered.push(node.id);
    }
  }

  return ordered.flatMap((nodeId, nodeIndex) =>
    lifecycleStatuses.map((status, statusIndex) => ({
      nodeId,
      status,
      progress:
        lifecycleProgress[Math.min(nodeIndex * lifecycleStatuses.length + statusIndex, lifecycleProgress.length - 1)],
    })),
  );
}
