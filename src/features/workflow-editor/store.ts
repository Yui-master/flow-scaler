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
import type { WorkflowEdge, WorkflowNode, WorkflowNodeKind } from "./types";
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

const cloneNodes = () =>
  initialNodes.map((node) => ({ ...node, data: { ...node.data } }));
const cloneEdges = () => initialEdges.map((edge) => ({ ...edge }));

const createNodeId = (kind: WorkflowNodeKind) =>
  `${kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

type WorkflowEditorState = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  connectionWarning: string | null;
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<WorkflowEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (kind: WorkflowNodeKind) => void;
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
    onNodesChange: (changes) =>
      set((state) => ({
        nodes: applyNodeChanges(changes, state.nodes),
      })),
    onEdgesChange: (changes) =>
      set((state) => ({
        edges: applyEdgeChanges(changes, state.edges),
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
      }));
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
    reset: () =>
      set({
        nodes: cloneNodes(),
        edges: cloneEdges(),
        selectedNodeId: null,
        selectedEdgeId: null,
        connectionWarning: null,
      }),
  }),
);
