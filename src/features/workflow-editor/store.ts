"use client";

import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import { create } from "zustand";

import { createWorkflowNode } from "./catalog";
import { validateWorkflowForJobStart } from "./job";
import type {
  WorkflowAssetMetadata,
  WorkflowEdge,
  WorkflowGraphValidationError,
  WorkflowJobState as BaseWorkflowJobState,
  WorkflowNode,
  WorkflowNodeKind,
  WorkflowNodeParamsByKind,
  WorkflowNodeStatus,
} from "./types";
import { validateWorkflowConnection } from "./validation";

const initialNodes: WorkflowNode[] = [
  createWorkflowNode("loadImage", "node-load-image", { x: 80, y: 120 }),
  createWorkflowNode("realesrganUpscale", "node-upscale", { x: 400, y: 120 }),
  createWorkflowNode("preview", "node-preview", { x: 720, y: 120 }),
  createWorkflowNode("exportFile", "node-export", { x: 720, y: 340 }),
];

const initialEdges: WorkflowEdge[] = [
  {
    id: "edge-load-upscale",
    source: "node-load-image",
    target: "node-upscale",
    type: "smoothstep",
  },
  {
    id: "edge-upscale-preview",
    source: "node-upscale",
    target: "node-preview",
    type: "smoothstep",
  },
  {
    id: "edge-upscale-export",
    source: "node-upscale",
    target: "node-export",
    type: "smoothstep",
  },
];

type WorkflowEditorJobState = Omit<BaseWorkflowJobState, "id" | "errorMessage"> & {
  id: string | null;
  errorMessage: string | null;
};

type WorkflowJobState = WorkflowEditorJobState;

let jobRunRevision = 0;
let jobIdCounter = 0;

type UpdateNodeParams = <K extends WorkflowNodeKind>(
  nodeId: string,
  params: Partial<WorkflowNodeParamsByKind[K]>,
) => void;

const initialJobState: WorkflowJobState = {
  id: null,
  status: "idle",
  progress: 0,
  errorMessage: null,
};

const cloneNodes = () =>
  initialNodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      inputTypes: [...node.data.inputTypes],
      outputTypes: [...node.data.outputTypes],
      params: {
        ...node.data.params,
        ...("asset" in node.data.params && node.data.params.asset
          ? { asset: { ...node.data.params.asset } }
          : {}),
      },
    },
  }));
const cloneEdges = () => initialEdges.map((edge) => ({ ...edge }));

const createNodeId = (kind: WorkflowNodeKind) =>
  `${kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const createJobId = () =>
  `job-${Date.now().toString(36)}-${(jobIdCounter++).toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const invalidateJobRun = () => {
  jobRunRevision += 1;
};

const cancelLocalJobSimulation = () => {
  invalidateJobRun();
  return { job: initialJobState, graphValidationErrors: [] };
};

type WorkflowEditorState = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  connectionWarning: string | null;
  job: WorkflowJobState;
  graphValidationErrors: WorkflowGraphValidationError[];
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<WorkflowEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (kind: WorkflowNodeKind) => void;
  updateNodeParams: UpdateNodeParams;
  attachAssetToNode: (nodeId: string, asset: WorkflowAssetMetadata) => void;
  setNodeError: (nodeId: string, errorMessage: string | null) => void;
  startJob: () => void;
  deleteSelection: () => void;
  clearConnectionWarning: () => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  setSelectedEdgeId: (edgeId: string | null) => void;
  reset: () => void;
};

export const useWorkflowEditorStore = create<WorkflowEditorState>(
  (set, get) => ({
    nodes: cloneNodes(),
    edges: cloneEdges(),
    selectedNodeId: null,
    selectedEdgeId: null,
    connectionWarning: null,
    job: initialJobState,
    graphValidationErrors: [],
    onNodesChange: (changes) =>
      set((state) => ({
        nodes: applyNodeChanges(changes, state.nodes),
        ...cancelLocalJobSimulation(),
      })),
    onEdgesChange: (changes) =>
      set((state) => ({
        edges: applyEdgeChanges(changes, state.edges),
        ...cancelLocalJobSimulation(),
      })),
    onConnect: (connection) => {
      const { nodes, edges } = get();
      const result = validateWorkflowConnection(connection, nodes, edges);

      if (!result.valid) {
        set({ connectionWarning: result.reason });
        return;
      }

      set({
        edges: addEdge({ ...connection, type: "smoothstep" }, edges),
        connectionWarning: null,
        ...cancelLocalJobSimulation(),
      });
    },
    addNode: (kind) => {
      const { nodes } = get();
      const offset = nodes.length * 24;
      const node = createWorkflowNode(kind, createNodeId(kind), {
        x: 140 + offset,
        y: 160 + offset,
      });

      set((state) => ({
        nodes: [...state.nodes, node],
        selectedNodeId: node.id,
        selectedEdgeId: null,
        ...cancelLocalJobSimulation(),
      }));
    },
    updateNodeParams: (nodeId, params) =>
      set((state) => ({
        nodes: state.nodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  params: { ...node.data.params, ...params },
                },
              }
            : node,
        ),
        ...cancelLocalJobSimulation(),
      })),
    attachAssetToNode: (nodeId, asset) =>
      set((state) => ({
        nodes: state.nodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  status: node.data.status === "failed" ? "idle" : node.data.status,
                  params: {
                    ...node.data.params,
                    asset,
                    errorMessage: undefined,
                  },
                },
              }
            : node,
        ),
        ...cancelLocalJobSimulation(),
      })),
    setNodeError: (nodeId, errorMessage) =>
      set((state) => ({
        nodes: state.nodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  status: errorMessage
                    ? "failed"
                    : node.data.status === "failed"
                      ? "idle"
                      : node.data.status,
                  params: {
                    ...node.data.params,
                    errorMessage: errorMessage ?? undefined,
                  },
                },
              }
            : node,
        ),
      })),
    startJob: async () => {
      const { nodes, edges } = get();
      let validation;

      try {
        validation = validateWorkflowForJobStart(nodes, edges);
      } catch (error) {
        set({
          graphValidationErrors: [
            {
              message:
                error instanceof Error
                  ? error.message
                  : "Unable to validate workflow.",
            },
          ],
          job: {
            id: null,
            status: "failed",
            progress: 0,
            errorMessage: "Fix workflow errors before starting a job.",
          },
        });
        return;
      }

      if (!validation.valid) {
        set({
          graphValidationErrors: validation.errors,
          job: {
            id: null,
            status: "failed",
            progress: 0,
            errorMessage: "Fix workflow errors before starting a job.",
          },
        });
        return;
      }

      const loadImage = nodes.find((node) => node.data.kind === "loadImage");
      const asset = loadImage && "asset" in loadImage.data.params ? loadImage.data.params.asset : undefined;

      if (!asset?.assetId) {
        set({
          graphValidationErrors: [
            {
              nodeId: loadImage?.id,
              message: "Load Image needs a server-uploaded asset before starting a job.",
            },
          ],
          job: {
            id: null,
            status: "failed",
            progress: 0,
            errorMessage: "Fix workflow errors before starting a job.",
          },
        });
        return;
      }

      invalidateJobRun();
      const runRevision = jobRunRevision;
      const jobId = createJobId();

      set({
        nodes: nodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            status:
              node.data.kind === "loadImage" ||
              node.data.kind === "realesrganUpscale" ||
              node.data.kind === "exportFile"
                ? "running"
                : "idle",
            params: { ...node.data.params, errorMessage: undefined },
          },
        })),
        graphValidationErrors: [],
        job: { id: jobId, status: "running", progress: 10, errorMessage: null },
      });

      try {
        const response = await fetch("/api/media/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nodes, edges }),
        });
        const payload = (await response.json()) as {
          job: {
            id: string;
            status: "completed" | "failed";
            progress: number;
            outputId?: string;
            downloadUrl?: string;
            errorMessage?: string;
          };
        };

        if (jobRunRevision !== runRevision) {
          return;
        }

        if (!response.ok || payload.job.status === "failed") {
          throw new Error(payload.job.errorMessage ?? "Media job failed.");
        }

        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.data.kind === "loadImage" ||
            node.data.kind === "realesrganUpscale" ||
            node.data.kind === "exportFile"
              ? { ...node, data: { ...node.data, status: "completed" } }
              : node,
          ),
          job: {
            id: payload.job.id,
            status: "completed",
            progress: 100,
            errorMessage: null,
            outputId: payload.job.outputId,
            downloadUrl: payload.job.downloadUrl,
          },
        }));
      } catch (error) {
        if (jobRunRevision !== runRevision) {
          return;
        }

        const errorMessage = error instanceof Error ? error.message : "Media job failed.";
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.data.kind === "realesrganUpscale"
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    status: "failed",
                    params: { ...node.data.params, errorMessage },
                  },
                }
              : node,
          ),
          job: {
            id: jobId,
            status: "failed",
            progress: 0,
            errorMessage,
          },
        }));
      }
    },
    deleteSelection: () =>
      set((state) => {
        const selectedNodeIds = new Set(
          state.nodes
            .filter((node) => node.selected || node.id === state.selectedNodeId)
            .map((node) => node.id),
        );
        const selectedEdgeIds = new Set(
          state.edges
            .filter((edge) => edge.selected || edge.id === state.selectedEdgeId)
            .map((edge) => edge.id),
        );

        return {
          nodes: state.nodes.filter((node) => !selectedNodeIds.has(node.id)),
          edges: state.edges.filter(
            (edge) =>
              !selectedEdgeIds.has(edge.id) &&
              !selectedNodeIds.has(edge.source) &&
              !selectedNodeIds.has(edge.target),
          ),
          selectedNodeId: null,
          selectedEdgeId: null,
          ...cancelLocalJobSimulation(),
        };
      }),
    clearConnectionWarning: () => set({ connectionWarning: null }),
    setSelectedNodeId: (selectedNodeId) =>
      set({
        selectedNodeId,
        selectedEdgeId: selectedNodeId ? null : get().selectedEdgeId,
      }),
    setSelectedEdgeId: (selectedEdgeId) =>
      set({
        selectedEdgeId,
        selectedNodeId: selectedEdgeId ? null : get().selectedNodeId,
      }),
    reset: () => {
      invalidateJobRun();
      set({
        nodes: cloneNodes(),
        edges: cloneEdges(),
        selectedNodeId: null,
        selectedEdgeId: null,
        connectionWarning: null,
        job: initialJobState,
        graphValidationErrors: [],
      });
    },
  }),
);

function updateNodeStatus(
  nodes: WorkflowNode[],
  nodeId: string,
  status: WorkflowNodeStatus,
): WorkflowNode[] {
  return nodes.map((node) =>
    node.id === nodeId
      ? { ...node, data: { ...node.data, status } }
      : node,
  );
}
