"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  type OnSelectionChangeParams,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useMemo } from "react";

import { NodeSidebar } from "../../../features/workflow-editor/components/node-sidebar";
import { WorkflowNode } from "../../../features/workflow-editor/components/workflow-node";
import { useWorkflowEditorStore } from "../../../features/workflow-editor/store";

export default function WorkflowEditorPage() {
  const {
    nodes,
    edges,
    connectionWarning,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    deleteSelection,
    clearConnectionWarning,
    setSelectedNodeId,
    setSelectedEdgeId,
    reset,
  } = useWorkflowEditorStore();

  const nodeTypes = useMemo(() => ({ workflowNode: WorkflowNode }), []);

  const handleSelectionChange = useCallback(
    ({
      nodes: selectedNodes,
      edges: selectedEdges,
    }: OnSelectionChangeParams<Node, Edge>) => {
      setSelectedNodeId(selectedNodes[0]?.id ?? null);
      setSelectedEdgeId(selectedEdges[0]?.id ?? null);
    },
    [setSelectedEdgeId, setSelectedNodeId],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        deleteSelection();
      }
    },
    [deleteSelection],
  );

  return (
    <main className="flex h-screen flex-col bg-zinc-950 text-white">
      <header className="flex items-center justify-between border-b border-yellow-500/20 bg-zinc-950 px-6 py-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.3em] text-yellow-400 uppercase">
            FlowScaler
          </p>
          <h1 className="text-2xl font-semibold text-white">Workflow Editor</h1>
        </div>
        <div className="flex items-center gap-3">
          {connectionWarning && (
            <button
              type="button"
              onClick={clearConnectionWarning}
              className="rounded-full border border-yellow-400/50 bg-yellow-400/10 px-4 py-2 text-sm font-medium text-yellow-100 hover:bg-yellow-400/20"
              title="Click to dismiss"
            >
              {connectionWarning}
            </button>
          )}
          <button
            type="button"
            onClick={reset}
            className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:border-yellow-400 hover:text-yellow-200"
          >
            Reset sample
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <NodeSidebar onAddNode={addNode} />
        <section
          className="min-w-0 flex-1"
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSelectionChange={handleSelectionChange}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onEdgeClick={(_, edge) => setSelectedEdgeId(edge.id)}
            onPaneClick={() => {
              setSelectedNodeId(null);
              setSelectedEdgeId(null);
            }}
            fitView
            className="bg-zinc-950"
          >
            <Background
              color="#3f3f46"
              variant={BackgroundVariant.Dots}
              gap={24}
            />
            <Controls />
            <MiniMap
              nodeColor="#facc15"
              maskColor="rgba(9, 9, 11, 0.75)"
              pannable
              zoomable
            />
          </ReactFlow>
        </section>
      </div>
    </main>
  );
}
