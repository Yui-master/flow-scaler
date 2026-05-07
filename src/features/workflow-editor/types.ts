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

export type WorkflowAssetKind = "image" | "video";

export type WorkflowAssetMetadata = {
  id: string;
  kind: WorkflowAssetKind;
  fileName: string;
  mimeType: string;
  size: number;
  previewUrl: string;
};

export type WorkflowNodeParamsByKind = {
  loadImage: { asset?: WorkflowAssetMetadata; errorMessage?: string };
  loadVideo: { asset?: WorkflowAssetMetadata; errorMessage?: string };
  extractFrames: { errorMessage?: string };
  realesrganUpscale: { model: string; scale: number; errorMessage?: string };
  frameSequenceProcessor: { errorMessage?: string };
  combineFrames: { errorMessage?: string };
  exportFile: { outputName: string; errorMessage?: string };
  preview: { errorMessage?: string };
};

export type WorkflowNodeParams = WorkflowNodeParamsByKind[WorkflowNodeKind];

export type WorkflowJobStatus = "idle" | "queued" | "running" | "completed" | "failed";

export type WorkflowJobState = {
  id: string;
  status: WorkflowJobStatus;
  progress: number;
  errorMessage?: string;
};

export type WorkflowGraphValidationError = {
  nodeId?: string;
  message: string;
};

export type WorkflowNodeData = {
  label: string;
  kind: WorkflowNodeKind;
  category: WorkflowNodeCategory;
  status: WorkflowNodeStatus;
  inputTypes: WorkflowDataType[];
  outputTypes: WorkflowDataType[];
  params: WorkflowNodeParams;
};

export type WorkflowNode = Node<WorkflowNodeData, "workflowNode">;
export type WorkflowEdge = Edge;
