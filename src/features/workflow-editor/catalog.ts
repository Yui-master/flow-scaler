import type {
  WorkflowDataType,
  WorkflowNode,
  WorkflowNodeCategory,
  WorkflowNodeKind,
  WorkflowNodeParams,
} from "./types";

export type WorkflowNodeDefinition = {
  kind: WorkflowNodeKind;
  label: string;
  category: WorkflowNodeCategory;
  description: string;
  inputTypes: WorkflowDataType[];
  outputTypes: WorkflowDataType[];
  params: WorkflowNodeParams;
};

export const workflowNodeDefinitions: WorkflowNodeDefinition[] = [
  {
    kind: "loadImage",
    label: "Load Image",
    category: "Input",
    description: "Import a source image asset.",
    inputTypes: [],
    outputTypes: ["image"],
    params: {},
  },
  {
    kind: "loadVideo",
    label: "Load Video",
    category: "Input",
    description: "Import a source video asset.",
    inputTypes: [],
    outputTypes: ["video"],
    params: {},
  },
  {
    kind: "extractFrames",
    label: "Extract Frames",
    category: "Processing",
    description: "Split a video into a frame sequence.",
    inputTypes: ["video"],
    outputTypes: ["frameSequence"],
    params: {},
  },
  {
    kind: "realesrganUpscale",
    label: "RealESRGAN Upscale",
    category: "Processing",
    description: "Upscale images or frame sequences.",
    inputTypes: ["image", "frameSequence"],
    outputTypes: ["image", "frameSequence"],
    params: { model: "realesrgan-x4plus", scale: 4 },
  },
  {
    kind: "frameSequenceProcessor",
    label: "Frame Sequence Processor",
    category: "Processing",
    description: "Apply batch operations to frame sequences.",
    inputTypes: ["frameSequence"],
    outputTypes: ["frameSequence"],
    params: {},
  },
  {
    kind: "combineFrames",
    label: "Combine Frames",
    category: "Processing",
    description: "Combine frames into a video file.",
    inputTypes: ["frameSequence"],
    outputTypes: ["video"],
    params: {},
  },
  {
    kind: "exportFile",
    label: "Export File",
    category: "Output",
    description: "Write an image, video, or frame sequence output.",
    inputTypes: ["image", "video", "frameSequence"],
    outputTypes: ["file"],
    params: { outputName: "flowscaler-output" },
  },
  {
    kind: "preview",
    label: "Preview Node",
    category: "Preview",
    description: "Preview intermediate media.",
    inputTypes: ["image", "video", "frameSequence"],
    outputTypes: [],
    params: {},
  },
];

export const workflowNodeDefinitionsByKind = Object.fromEntries(
  workflowNodeDefinitions.map((definition) => [definition.kind, definition]),
) as Record<WorkflowNodeKind, WorkflowNodeDefinition>;

export const workflowNodeCategories: WorkflowNodeCategory[] = [
  "Input",
  "Processing",
  "Output",
  "Preview",
];

export function createWorkflowNode(
  kind: WorkflowNodeKind,
  id: string,
  position: WorkflowNode["position"],
): WorkflowNode {
  const definition = workflowNodeDefinitionsByKind[kind];

  return {
    id,
    type: "workflowNode",
    position,
    data: {
      label: definition.label,
      kind: definition.kind,
      category: definition.category,
      status: "idle",
      inputTypes: [...definition.inputTypes],
      outputTypes: [...definition.outputTypes],
      params: { ...definition.params },
    },
  };
}
