"use client";

import { useEffect, useRef } from "react";
import dagre from "dagre";

interface NodeData {
  id: any;
  name: string;
  width: number;
  height: number;
  isCritical?: boolean;
  dueDate?: string | null;
}

interface EdgeData {
  source: any;
  target: any;
  isCritical?: boolean;
}

export default function Graph({
  data,
}: {
  data: { nodes: NodeData[]; edges: EdgeData[] };
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!data || data.nodes.length === 0) return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const width = canvas.width;
    const height = canvas.height;

    // DAGRE LAYOUT
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: "TB" });

    g.setDefaultEdgeLabel(() => ({}));

    data.nodes.forEach((node) => {
      g.setNode(node.id, {
        width: node.width,
        height: node.height,
      });
    });

    data.edges.forEach((edge) => {
      g.setEdge(edge.source, edge.target);
    });

    dagre.layout(g);

    const positionedNodes = data.nodes.map((n) => {
      const pos = g.node(n.id);
      return {
        ...n,
        x: pos.x,
        y: pos.y,
      };
    });

    const nodeMap = new Map();
    positionedNodes.forEach((n) => nodeMap.set(n.id, n));

    const positionedEdges = data.edges.map((e) => ({
      ...e,
      points: g.edge(e.source, e.target).points,
    }));

    // DRAW GRAPH
    ctx.clearRect(0, 0, width, height);

    ctx.font = "14px sans-serif";

    // EDGES
    positionedEdges.forEach((edge) => {
      ctx.strokeStyle = edge.isCritical ? "yellow" : "#333";
      ctx.lineWidth = edge.isCritical ? 3 : 1.5;

      ctx.beginPath();
      const pts = edge.points;

      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();

      const end = pts[pts.length - 1];
      const prev = pts[pts.length - 2];
      const angle = Math.atan2(end.y - prev.y, end.x - prev.x);

      const arrowSize = 10;
      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(
        end.x - arrowSize * Math.cos(angle - Math.PI / 6),
        end.y - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        end.x - arrowSize * Math.cos(angle + Math.PI / 6),
        end.y - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = edge.isCritical ? "yellow" : "#333";
      ctx.fill();
    });

    // NODES
    positionedNodes.forEach((node) => {
      const pad = 8;

      ctx.fillStyle = node.isCritical ? "yellow" : "white";
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.roundRect(
        node.x - node.width / 2,
        node.y - node.height / 2,
        node.width,
        node.height,
        6
      );
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "black";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.name, node.x, node.y - 2);

      if (node.dueDate) {
        ctx.font = "12px sans-serif";
        ctx.fillText(node.dueDate, node.x, node.y + 12);
        ctx.font = "14px sans-serif";
      }
    });
  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      width={1200}
      height={700}
      style={{ width: "100%", height: "700px" }}
    />
  );
}
