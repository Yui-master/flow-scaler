import type { Edge, Node } from "@xyflow/react";

export type WorkflowDataType =
  | "video"
  | "image"
  | "frameSequence"
  | "audio"
  | "model"
  | "config"
  | "file";

export type WorkflowNodeKind =
  | "loadImage"
  | "loadVideo"
  | "extractFrames"
  | "realesrganUpscale"
  | "frameSequenceProcessor"
  | "combineFrames"
  | "exportFile"
  | "preview";

export type WorkflowNodeCategory =
  | "Input"
  | "Processing"
  | "Output"
  | "Preview";

export type WorkflowNodeStatus =
  | "idle"
  | "queued"
  | "running"
  | "completed"
  | "failed";

export type WorkflowNodeData = {
  label: string;
  kind: WorkflowNodeKind;
  category: WorkflowNodeCategory;
  status: WorkflowNodeStatus;
  inputTypes: WorkflowDataType[];
  outputTypes: WorkflowDataType[];
  params: Record<string, unknown>;
};

export type WorkflowNode = Node<WorkflowNodeData, "workflowNode">;
export type WorkflowEdge = Edge;
