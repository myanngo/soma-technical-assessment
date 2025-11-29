"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { format } from "date-fns";

import Graph from "./Graph";

export default function GraphPage() {
  const [todos, setTodos] = useState([]);
  const [criticalPath, setCriticalPath] = useState<number[]>([]);

  useEffect(() => {
    async function loadData() {
      const res = await fetch("/api/todos");
      const data = await res.json();

      setTodos(data);

      //CRITICAL PATH
      const graph = new Map<number, number[]>();

      data.forEach((t: any) => {
        graph.set(
          t.id,
          t.dependencies.map((d: any) => d.id)
        );
      });

      function dfs(nodeId: number, visited = new Set<number>()): number[] {
        if (visited.has(nodeId)) return [];
        visited.add(nodeId);

        const deps = graph.get(nodeId) || [];
        if (deps.length === 0) return [nodeId];

        let longest: number[] = [];

        for (const d of deps) {
          const path = dfs(d, new Set(visited));
          if (path.length > longest.length) longest = path;
        }
        return [...longest, nodeId];
      }

      let best: number[] = [];
      for (const t of data) {
        if (!t.dueDate) continue;
        const cp = dfs(t.id);
        if (cp.length > best.length) best = cp;
      }

      setCriticalPath(best);
    }

    loadData();
  }, []);

  // GRAPH DATA
  const graphData = useMemo(() => {
    const nodes = todos.map((t: any) => ({
      id: t.id,
      name: t.title,
      width: 140,
      height: 40,
      dueDate: t.dueDate ? format(new Date(t.dueDate), "MM/dd/yyyy") : null,
      isCritical: criticalPath.includes(t.id),
    }));

    const edges: any[] = [];
    todos.forEach((t: any) => {
      t.dependencies.forEach((dep: any) => {
        edges.push({
          source: dep.id,
          target: t.id,
          isCritical:
            criticalPath.includes(dep.id) && criticalPath.includes(t.id),
        });
      });
    });

    return { nodes, edges };
  }, [todos, criticalPath]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-500 to-red-500 text-white p-6">
      <Link
        href="/"
        className="inline-block mb-4 text-blue-300 hover:text-blue-400 underline"
      >
        ← Back
      </Link>

      <h1 className="text-3xl font-bold mb-2">Todo Dependency Graphs</h1>
      <p className="text-sm mb-4">
        Critical path is highlighted in{" "}
        <span className="font-bold text-yellow-300">yellow</span>.
      </p>

      <div className="bg-white rounded-lg p-4 shadow-lg">
        <Graph data={graphData} />
      </div>
    </div>
  );
}
