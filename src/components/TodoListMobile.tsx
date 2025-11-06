"use client";

import React, { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Calendar,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { createTodoNotification } from "@/lib/notificationHelpers";
import { useRecycleBin } from "@/contexts/RecycleBinContext";

interface Todo {
  id: string;
  userId: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  dueDate: string;
  status: "pending" | "in-progress" | "completed";
  createdAt: string;
  updatedAt: string;
}

type FilterStatus = "all" | "pending" | "in-progress" | "completed";
type SortBy = "dueDate" | "priority" | "status" | "createdAt";

export default function TodoListMobile() {
  const { moveToRecycleBin } = useRecycleBin();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high">(
    "medium"
  );
  const [newDueDate, setNewDueDate] = useState("");
  const [newStatus, setNewStatus] = useState<
    "pending" | "in-progress" | "completed"
  >("pending");

  // Edit form states
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<"low" | "medium" | "high">(
    "medium"
  );
  const [editDueDate, setEditDueDate] = useState("");
  const [editStatus, setEditStatus] = useState<
    "pending" | "in-progress" | "completed"
  >("pending");

  // Filter & Sort states
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<SortBy>("dueDate");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUserId(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadTodos();
    }
  }, [currentUserId]);

  const loadTodos = () => {
    if (!currentUserId) return;
    const stored = localStorage.getItem(`todos_${currentUserId}`);
    if (stored) {
      try {
        setTodos(JSON.parse(stored));
      } catch (error) {
        console.error("Error loading todos:", error);
        setTodos([]);
      }
    }
  };

  const saveTodos = (updatedTodos: Todo[]) => {
    if (!currentUserId) return;
    localStorage.setItem(
      `todos_${currentUserId}`,
      JSON.stringify(updatedTodos)
    );
    setTodos(updatedTodos);
  };

  const handleAddTodo = async () => {
    if (!newTitle.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!currentUserId) {
      toast.error("User not authenticated");
      return;
    }

    setLoading(true);
    try {
      const newTodo: Todo = {
        id: Date.now().toString(),
        userId: currentUserId,
        title: newTitle.trim(),
        description: newDescription.trim(),
        priority: newPriority,
        dueDate: newDueDate,
        status: newStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedTodos = [...todos, newTodo];
      saveTodos(updatedTodos);

      // Reset form
      setNewTitle("");
      setNewDescription("");
      setNewPriority("medium");
      setNewDueDate("");
      setNewStatus("pending");
      setShowAddForm(false);

      toast.success("Task added successfully");
    } catch (error) {
      console.error("Error adding todo:", error);
      toast.error("Failed to add task");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTodo = async (id: string) => {
    if (!editTitle.trim()) {
      toast.error("Title is required");
      return;
    }

    setLoading(true);
    try {
      const updatedTodos = todos.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              title: editTitle.trim(),
              description: editDescription.trim(),
              priority: editPriority,
              dueDate: editDueDate,
              status: editStatus,
              updatedAt: new Date().toISOString(),
            }
          : todo
      );

      saveTodos(updatedTodos);

      // Check if status changed to completed
      const todo = todos.find((t) => t.id === id);
      if (todo && todo.status !== "completed" && editStatus === "completed") {
        await createTodoNotification("complete", {
          title: editTitle.trim(),
        });
      }

      setEditingId(null);
      toast.success("Task updated successfully");
    } catch (error) {
      console.error("Error updating todo:", error);
      toast.error("Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    const todoToDelete = todos.find((todo) => todo.id === id);
    if (!todoToDelete) return;

    if (!confirm("Move this task to Recycle Bin?")) return;

    setLoading(true);
    try {
      await moveToRecycleBin("todo", todoToDelete, id);
      const updatedTodos = todos.filter((todo) => todo.id !== id);
      saveTodos(updatedTodos);
    } catch (error) {
      console.error("Error deleting todo:", error);
      toast.error("Failed to delete task");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditDescription(todo.description);
    setEditPriority(todo.priority);
    setEditDueDate(todo.dueDate);
    setEditStatus(todo.status);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
    setEditPriority("medium");
    setEditDueDate("");
    setEditStatus("pending");
  };

  const getFilteredAndSortedTodos = () => {
    let filtered = todos;

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((todo) => todo.status === filterStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "dueDate":
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case "priority":
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case "status":
          const statusOrder = { pending: 0, "in-progress": 1, completed: 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        case "createdAt":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        default:
          return 0;
      }
    });

    return filtered;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-600 border-red-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-700 border-yellow-500/30";
      case "low":
        return "bg-green-500/20 text-green-700 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-600 border-gray-500/30";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-700 border-green-500/30";
      case "in-progress":
        return "bg-blue-500/20 text-blue-700 border-blue-500/30";
      case "pending":
        return "bg-gray-500/20 text-gray-600 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-600 border-gray-500/30";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "No due date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filteredTodos = getFilteredAndSortedTodos();

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-3">
      {/* Header with Filter and Sort */}
      <div className="space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-black">
            TODO List ({filteredTodos.length})
          </h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-all"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter */}
          <div className="flex items-center gap-1.5 flex-1">
            <Filter className="w-3.5 h-3.5 text-black" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="flex-1 px-2 py-1.5 text-xs rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Filter tasks by status"
              aria-label="Filter tasks by status"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5 flex-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-black" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="flex-1 px-2 py-1.5 text-xs rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Sort tasks by"
              aria-label="Sort tasks by"
            >
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
              <option value="createdAt">Created</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <div className="p-3 rounded border border-gray-200 bg-white space-y-2 shrink-0">
          <h3 className="text-sm font-medium text-black">New Task</h3>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Task title *"
            className="w-full px-3 py-2 text-sm rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full px-3 py-2 text-sm rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={newPriority}
              onChange={(e) =>
                setNewPriority(e.target.value as "low" | "medium" | "high")
              }
              title="Task priority"
              aria-label="Task priority"
              className="px-2 py-1.5 text-xs rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <select
              value={newStatus}
              onChange={(e) =>
                setNewStatus(
                  e.target.value as "pending" | "in-progress" | "completed"
                )
              }
              title="Task status"
              aria-label="Task status"
              className="px-2 py-1.5 text-xs rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <input
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            title="Task due date"
            aria-label="Task due date"
            className="w-full px-2 py-1.5 text-xs rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddTodo}
              disabled={loading || !newTitle.trim()}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-all disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              Save
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewTitle("");
                setNewDescription("");
                setNewPriority("medium");
                setNewDueDate("");
                setNewStatus("pending");
              }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded transition-all"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin">
        {filteredTodos.length === 0 ? (
          <div className="flex items-center justify-center h-full text-black text-sm">
            No tasks found
          </div>
        ) : (
          filteredTodos.map((todo) => (
            <div
              key={todo.id}
              className="p-3 rounded border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
            >
              {editingId === todo.id ? (
                // Edit Mode
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Task title"
                    aria-label="Edit task title"
                    className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={2}
                    placeholder="Task description"
                    aria-label="Edit task description"
                    className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={editPriority}
                      onChange={(e) =>
                        setEditPriority(
                          e.target.value as "low" | "medium" | "high"
                        )
                      }
                      title="Task priority"
                      aria-label="Edit task priority"
                      className="px-2 py-1.5 text-xs rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    <select
                      value={editStatus}
                      onChange={(e) =>
                        setEditStatus(
                          e.target.value as
                            | "pending"
                            | "in-progress"
                            | "completed"
                        )
                      }
                      title="Task status"
                      aria-label="Edit task status"
                      className="px-2 py-1.5 text-xs rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    title="Task due date"
                    aria-label="Edit task due date"
                    className="w-full px-2 py-1.5 text-xs rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateTodo(todo.id)}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-all disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded transition-all disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium text-black flex-1">
                      {todo.title}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(todo)}
                        disabled={loading}
                        className="p-1 text-gray-600 hover:text-blue-600 transition-colors disabled:opacity-50"
                        title="Edit task"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTodo(todo.id)}
                        disabled={loading}
                        className="p-1 text-gray-600 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {todo.description && (
                    <p className="text-xs text-black">{todo.description}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 text-xs rounded border ${getPriorityColor(
                        todo.priority
                      )}`}
                    >
                      {todo.priority.charAt(0).toUpperCase() +
                        todo.priority.slice(1)}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded border ${getStatusColor(
                        todo.status
                      )}`}
                    >
                      {todo.status === "in-progress"
                        ? "In Progress"
                        : todo.status.charAt(0).toUpperCase() +
                          todo.status.slice(1)}
                    </span>
                    {todo.dueDate && (
                      <span className="flex items-center gap-1 text-xs text-black">
                        <Calendar className="w-3 h-3" />
                        {formatDate(todo.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
