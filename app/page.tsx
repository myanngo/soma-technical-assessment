"use client";
import { Todo } from "@prisma/client";
import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import Select, { components } from "react-select";

export default function Home() {
  const [newTodo, setNewTodo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [todos, setTodos] = useState<any[]>([]);
  const [loadingImageIds, setLoadingImageIds] = useState<number[]>([]);

  useEffect(() => {
    fetchTodos();
  }, []);

  // FETCH FUNCTIONS
  const fetchTodos = async () => {
    try {
      const res = await fetch("/api/todos");
      const data = await res.json();
      console.log("Fetched todos:", data);
      setTodos(data);
    } catch (error) {
      console.error("Failed to fetch todos:", error);
    }
  };

  const fetchTodoImage = async (todoId: number, title: string) => {
    setLoadingImageIds((prev) => [...prev, todoId]);

    try {
      const res = await fetch(
        `/api/pexels?query=${encodeURIComponent(title)}&id=${todoId}`
      );
      await res.json();
      fetchTodos();
    } catch (error) {
      console.error("Image fetch failed", error);
    }

    setLoadingImageIds((prev) => prev.filter((i) => i !== todoId));
  };

  // HANDLE ADDING AND DELETING FUNCTIONS
  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTodo, dueDate: dueDate }),
      });
      setNewTodo("");
      fetchTodos();

      const todo = await res.json();
      fetchTodoImage(todo.id, todo.title);
    } catch (error) {
      console.error("Failed to add todo:", error);
    }
  };

  const handleDeleteTodo = async (id: any) => {
    try {
      await fetch(`/api/todos/${id}`, {
        method: "DELETE",
      });
      fetchTodos();
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  };

  const handleAddDependency = async (id: number, dependencyId: number) => {
    const res = await fetch(`/api/todos/dependency`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, dependencyId }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error);
      return;
    }

    fetchTodos();
  };

  // DATE FUNCTION
  const isOverdue = (date: string) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const formatDate = (date: string) => {
    if (!date) return false;
    const parsedDate = parseISO(date);
    return format(parsedDate, "MM/dd/yyyy");
  };

  // DEPENDENCY SELECT FUNCTIONS
  const CheckboxOption = (props: any) => (
    <components.Option {...props}>
      <input type="checkbox" checked={props.isSelected} readOnly />{" "}
      {props.label}
    </components.Option>
  );

  const getAllDependents = (currentTodoId: number, allTodos: any[]) => {
    const stack = [currentTodoId];
    const visited = new Set<number>();

    while (stack.length) {
      const current = stack.pop()!;
      allTodos.forEach((t) => {
        if (
          t.dependencies?.some((d: any) => d.id === current) &&
          !visited.has(t.id)
        ) {
          visited.add(t.id);
          stack.push(t.id);
        }
      });
    }
    return visited;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-500 to-red-500 flex flex-col items-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center text-white mb-8">
          Things To Do App
        </h1>

        <div className="flex mb-6">
          <input
            type="text"
            className="flex-grow p-3 rounded-l-full focus:outline-none text-gray-700"
            placeholder="Add a new todo"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <button
            onClick={handleAddTodo}
            className="bg-white text-indigo-600 p-3 rounded-r-full hover:bg-gray-100 transition duration-300"
          >
            Add
          </button>
        </div>

        <ul>
          {todos.map((todo: any) => (
            <li
              key={todo.id}
              className="bg-white bg-opacity-90 p-4 mb-4 rounded-lg shadow-lg flex flex-col items-center space-y-3"
            >
              <div className="flex  w-full">
                <div className="w-4/5">
                  <span className="font-semibold text-gray-900 w-fit mr-2">
                    {todo.title}
                  </span>
                  <span
                    className={`text-sm ${
                      isOverdue(todo.dueDate) ? "text-red-500" : "text-gray-500"
                    } w-fit`}
                  >
                    {formatDate(todo.dueDate) || "No due date"}
                  </span>
                </div>
                <div className="w-1/5 flex justify-end">
                  <button
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="text-red-500 hover:text-red-700 transition duration-300"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="w-full flex justify-center">
                {loadingImageIds.includes(todo.id) ? (
                  <div className="animate-pulse text-gray-500">
                    Loading image…
                  </div>
                ) : todo.imageUrl ? (
                  <img
                    src={todo.imageUrl}
                    alt={todo.title}
                    className="rounded-lg max-h-48 object-cover"
                  />
                ) : (
                  <div className="text-gray-400 text-sm">No image</div>
                )}
              </div>

              <div className="w-full">
                <label className="text-sm text-gray-600">Dependencies:</label>

                <Select
                  options={todos
                    .filter((t) => {
                      if (t.id !== todo.id) {
                        return true;
                      }
                      const dependents = getAllDependents(todo.id, todos);

                      if (dependents.has(t.id)) return false;
                    })
                    .map((t) => ({ value: t.id, label: t.title }))}
                  isMulti
                  closeMenuOnSelect={false}
                  hideSelectedOptions={false}
                  components={{ Option: CheckboxOption }}
                  value={todo.dependencies?.map((d: any) => ({
                    value: d.id,
                    label: d.title,
                  }))}
                  onChange={(selected: any) => {
                    selected.forEach((s: any) => {
                      handleAddDependency(todo.id, s.value);
                    });
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
