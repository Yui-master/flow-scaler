import type {
  WorkflowEdge,
  WorkflowGraphValidationError,
  WorkflowNode,
  WorkflowNodeParamsByKind,
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
const dagErrorMessage = "Workflow graph must be a DAG.";
const missingEndpointErrorMessage = "Workflow contains an edge with a missing node.";

type GraphAnalysis = {
  orderedIds: string[];
  reachableIds: Set<string>;
};

function analyzeWorkflowGraph(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
): GraphAnalysis {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const incoming = new Map(nodes.map((node) => [node.id, new Set<string>()]));
  const outgoing = new Map(nodes.map((node) => [node.id, new Set<string>()]));

  for (const edge of edges) {
    if (!nodeById.has(edge.source) || !nodeById.has(edge.target)) {
      throw new Error(missingEndpointErrorMessage);
    }

    outgoing.get(edge.source)!.add(edge.target);
    incoming.get(edge.target)!.add(edge.source);
  }

  const incomingCount = new Map(
    nodes.map((node) => [node.id, incoming.get(node.id)?.size ?? 0]),
  );
  const queue = nodes
    .filter((node) => (incomingCount.get(node.id) ?? 0) === 0)
    .map((node) => node.id);
  const allOrderedIds: string[] = [];
  const orderedSet = new Set<string>();

  for (let index = 0; index < queue.length; index += 1) {
    const nodeId = queue[index]!;
    if (orderedSet.has(nodeId)) {
      continue;
    }

    allOrderedIds.push(nodeId);
    orderedSet.add(nodeId);

    for (const targetId of outgoing.get(nodeId) ?? []) {
      const nextIncomingCount = (incomingCount.get(targetId) ?? 0) - 1;
      incomingCount.set(targetId, nextIncomingCount);
      if (nextIncomingCount === 0) {
        queue.push(targetId);
      }
    }
  }

  if (allOrderedIds.length !== nodes.length) {
    throw new Error(dagErrorMessage);
  }

  const exportIds = nodes
    .filter(
      (node) =>
        node.data.kind === "exportFile" && (incoming.get(node.id)?.size ?? 0) > 0,
    )
    .map((node) => node.id);
  const reachableIds = new Set<string>();
  const reverseQueue = [...exportIds];

  for (let index = 0; index < reverseQueue.length; index += 1) {
    const nodeId = reverseQueue[index]!;
    if (reachableIds.has(nodeId)) {
      continue;
    }

    reachableIds.add(nodeId);

    for (const sourceId of incoming.get(nodeId) ?? []) {
      reverseQueue.push(sourceId);
    }
  }

  return {
    orderedIds: allOrderedIds.filter((nodeId) => reachableIds.has(nodeId)),
    reachableIds,
  };
}

export function validateWorkflowForJobStart(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
): WorkflowJobValidationResult {
  const errors: WorkflowGraphValidationError[] = [];

  for (const node of nodes) {
    switch (node.data.kind) {
      case "loadVideo": {
        const params = node.data.params as WorkflowNodeParamsByKind["loadVideo"];
        const asset = params.asset;
        if (asset?.kind !== "video" || asset.mimeType !== "video/mp4") {
          errors.push({
            nodeId: node.id,
            message: "Load Video needs an uploaded MP4 file.",
          });
        }
        break;
      }
      case "loadImage": {
        const params = node.data.params as WorkflowNodeParamsByKind["loadImage"];
        const asset = params.asset;
        if (
          asset?.kind !== "image" ||
          !["image/png", "image/jpeg"].includes(asset.mimeType)
        ) {
          errors.push({
            nodeId: node.id,
            message: "Load Image needs an uploaded PNG or JPG file.",
          });
        }
        break;
      }
      case "realesrganUpscale": {
        const params = node.data.params as WorkflowNodeParamsByKind["realesrganUpscale"];
        const model = params.model;
        if (typeof model !== "string" || model.trim() === "") {
          errors.push({
            nodeId: node.id,
            message: "RealESRGAN Upscale needs a model preset.",
          });
        }
        break;
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

  try {
    analyzeWorkflowGraph(nodes, edges);
  } catch (error) {
    errors.push({
      message: error instanceof Error ? error.message : dagErrorMessage,
    });
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
  const { orderedIds } = analyzeWorkflowGraph(nodes, edges);

  return orderedIds.flatMap((nodeId, nodeIndex) =>
    lifecycleStatuses.map((status, statusIndex) => ({
      nodeId,
      status,
      progress:
        lifecycleProgress[
          Math.min(
            nodeIndex * lifecycleStatuses.length + statusIndex,
            lifecycleProgress.length - 1,
          )
        ]!,
    })),
  );
}
