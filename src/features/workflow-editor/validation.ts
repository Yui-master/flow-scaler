import type { Connection } from "@xyflow/react";

import type { WorkflowEdge, WorkflowNode } from "./types";

type WorkflowConnectionValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

export function validateWorkflowConnection(
  connection: Pick<Connection, "source" | "target">,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
): WorkflowConnectionValidationResult {
  const { source, target } = connection;

  if (!source || !target) {
    return {
      valid: false,
      reason: "A connection requires a source and target.",
    };
  }

  if (source === target) {
    return { valid: false, reason: "A node cannot connect to itself." };
  }

  const sourceNode = nodes.find((node) => node.id === source);
  const targetNode = nodes.find((node) => node.id === target);

  if (!sourceNode || !targetNode) {
    return {
      valid: false,
      reason: "Connection source or target node was not found.",
    };
  }

  if (edges.some((edge) => edge.source === source && edge.target === target)) {
    return {
      valid: false,
      reason: `${sourceNode.data.label} is already connected to ${targetNode.data.label}.`,
    };
  }

  const hasCompatibleType = sourceNode.data.outputTypes.some((outputType) =>
    targetNode.data.inputTypes.includes(outputType),
  );

  if (hasCompatibleType) {
    return { valid: true };
  }

  return {
    valid: false,
    reason: `${sourceNode.data.label} outputs ${sourceNode.data.outputTypes.join(
      " or ",
    )}, but ${targetNode.data.label} expects ${targetNode.data.inputTypes.join(" or ")}.`,
  };
}
