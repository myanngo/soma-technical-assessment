import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Check for circular dependency:
 * Returns true if dependencyId already depends on id (directly or indirectly)
 */
async function createsCycle(
  id: number,
  dependencyId: number
): Promise<boolean> {
  const stack = [dependencyId];
  const visited = new Set<number>();

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === id) return true;

    if (visited.has(current)) continue;
    visited.add(current);

    const task = await prisma.todo.findUnique({
      where: { id: current },
      include: { dependencies: true },
    });

    if (!task) continue;

    for (const dep of task.dependencies) {
      stack.push(dep.id);
    }
  }

  return false;
}

export async function POST(request: Request) {
  try {
    const { id, dependencyId } = await request.json();

    if (!id || !dependencyId)
      return NextResponse.json(
        { error: "Both id and dependencyId are required" },
        { status: 400 }
      );

    if (id === dependencyId)
      return NextResponse.json(
        { error: "A task cannot depend on itself" },
        { status: 400 }
      );

    const cycle = await createsCycle(id, dependencyId);
    if (cycle) {
      return NextResponse.json(
        { error: "Circular dependency detected" },
        { status: 500 }
      );
    }

    const updated = await prisma.todo.update({
      where: { id },
      data: {
        dependencies: {
          connect: { id: dependencyId },
        },
      },
      include: {
        dependencies: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Dependency error:", error);
    return NextResponse.json(
      { error: "Error adding dependency" },
      { status: 500 }
    );
  }
}
