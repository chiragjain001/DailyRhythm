"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, Edit2, MoreHorizontal, Trash2, GripVertical, Plus, X, Check, ChevronRight } from "lucide-react"
import { useSupabaseTasks } from "@/hooks/useSupabaseTasks"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TaskModal } from "./task-modal"
import { TaskCard } from "./task-card"

export function AgendaList() {
  const { tasks, toggleTask, addTask, deleteTask, updateTask, loading, error } = useSupabaseTasks()
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)


  const priorityWeight = (p: "important" | "today" | "habit" | string) =>
    p === "important" ? 0 : p === "today" ? 1 : 2
  const visible = (tasks ?? [])
    .map((t, originalIndex) => ({ t, originalIndex }))
    .sort((a, b) => {
      const w = priorityWeight(a.t.priority) - priorityWeight(b.t.priority)
      return w !== 0 ? w : a.originalIndex - b.originalIndex
    })

  // All tasks sorted by priority for modal
  const allTasksSorted = [...(tasks ?? [])]
    .sort((a, b) => {
      const w = priorityWeight(a.priority) - priorityWeight(b.priority)
      return w !== 0 ? w : 0
    })

  async function handleAddTask(taskData: any) {
    try {
      await addTask({
        ...taskData,
        progress: 0,
        completed: false,
      })
      setShowAddTaskModal(false)
    } catch (err) {
      console.error('Failed to add task:', err)
    }
  }

  async function handleEditTask(taskData: any) {
    if (editingTask) {
      try {
        await updateTask(editingTask.id, taskData)
        setEditingTask(null)
      } catch (err) {
        console.error('Failed to update task:', err)
      }
    }
  }

  async function handleDeleteTask(id: string) {
    setDeletingTaskId(id)
    try {
      await deleteTask(id)
    } catch (err) {
      console.error('Failed to delete task:', err)
    } finally {
      setDeletingTaskId(null)
    }
  }

  function onEdit(id: string) {
    const task = tasks?.find(t => t.id === id)
    if (task) {
      setEditingTask(task)
    }
  }

  if (loading) {
    return (
      <Card className="rounded-3xl border-none bg-white shadow-sm h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 pb-2 pt-4 md:px-6 flex-shrink-0">
          <CardTitle className="text-base font-semibold">Today's Agenda</CardTitle>
        </CardHeader>
        <CardContent className="px-4 md:px-6 flex-1 flex items-center justify-center">
          <div className="text-neutral-500">Loading tasks...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="rounded-3xl border-none bg-white shadow-sm h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 pb-2 pt-4 md:px-6 flex-shrink-0">
          <CardTitle className="text-base font-semibold">Today's Agenda</CardTitle>
        </CardHeader>
        <CardContent className="px-4 md:px-6 flex-1 flex items-center justify-center">
          <div className="text-red-500">Error loading tasks: {error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="rounded-3xl border-none bg-white shadow-sm h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 pb-2 pt-4 md:px-6 flex-shrink-0">
        <CardTitle className="text-base font-semibold ">Today's Agenda</CardTitle>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Add task" onClick={() => setShowAddTaskModal(true)}>
            <Plus className="h-5 w-5 text-neutral-500" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="More" onClick={() => setShowTaskModal(true)}>
            <ChevronRight className="h-5 w-5 text-neutral-500" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 md:px-6 flex-1 flex flex-col min-h-0">
        {/* Scrollable tasks area */}
        <div className="flex-1 overflow-y-auto space-y-3 pb-3">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="h-12 w-12 text-neutral-300 mb-3" />
              <p className="text-sm text-neutral-500 font-medium">No tasks yet</p>
              <p className="text-xs text-neutral-400 mt-1">Click + to add your first task</p>
            </div>
          ) : (
            <AnimatePresence>
              {visible.map(({ t, originalIndex }) => (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <TaskCard
                    task={t}
                    onToggleComplete={toggleTask}
                    onEdit={onEdit}
                    onDelete={handleDeleteTask}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Quick Add Task Button */}
        <div className="flex-shrink-0 pt-3">
          <motion.button
            onClick={() => setShowAddTaskModal(true)}
            className="mt-2 flex w-full items-center justify-between rounded-full border border-neutral-200 bg-white py-3 px-4 text-left text-sm text-neutral-500 shadow-sm hover:bg-neutral-50 transition-colors"
            aria-label="Add a task"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="flex items-center gap-3">
              <Plus className="h-4 w-4 text-neutral-400" />
              <span className="text-neutral-600 font-medium">Add a task</span>
            </span>
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100">
              <MoreHorizontal className="h-4 w-4 text-neutral-400" />
            </span>
          </motion.button>
        </div>
      </CardContent>
      </Card>

      {/* Task Modal */}
      {showTaskModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowTaskModal(false)
            }
          }}
        >
          {/* Background overlay with blur effect */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

          {/* Modal Card */}
          <div className="relative w-full max-w-2xl h-[80vh] bg-white rounded-3xl shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300 flex flex-col sm:w-2/3 md:w-1/2">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-100 flex-shrink-0">
              <h2 className="text-lg font-semibold text-neutral-900">All Tasks</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowTaskModal(false)}
                className="rounded-full hover:bg-neutral-100"
                aria-label="Close modal"
              >
                <X className="h-5 w-5 text-neutral-500" />
              </Button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {allTasksSorted.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="text-neutral-400 mb-2">
                    <Clock className="h-12 w-12 mx-auto mb-3" />
                  </div>
                  <p className="text-neutral-600 font-medium">No tasks yet</p>
                  <p className="text-sm text-neutral-400">Add your first task to get started</p>
                </div>
              ) : (
                allTasksSorted.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "rounded-2xl border border-neutral-100 bg-neutral-50 p-4 transition-colors hover:bg-neutral-100",
                      deletingTaskId === task.id && "transform translate-x-full transition-transform duration-500 ease-in-out"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                          aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
                          onClick={() => toggleTask(task.id)}
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-lime-300 flex-shrink-0",
                            task.completed ? "bg-lime-400 text-[#1F2F4A]" : "bg-white text-neutral-400",
                          )}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-medium truncate",
                            task.completed ? "text-neutral-500 line-through" : "text-neutral-900"
                          )}>
                            {task.title}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
                            <span className={cn(
                              "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                              task.priority === "important"
                                ? "bg-red-100 text-red-700"
                                : task.priority === "today"
                                ? "bg-lime-100 text-lime-700"
                                : "bg-purple-100 text-purple-700"
                            )}>
                              {task.priority === "important" ? "Important" : task.priority === "today" ? "Today" : "Habit"}
                            </span>
                            {task.time && (
                              <span className="text-neutral-400">• {task.time}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="rounded-full bg-pink-100 text-pink-700 hover:bg-pink-200 h-8 w-8"
                          aria-label="Edit"
                          onClick={() => onEdit(task.id)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete"
                          onClick={() => handleDeleteTask(task.id)}
                          className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          task.priority === "important" ? "bg-red-400" : task.priority === "today" ? "bg-lime-400" : "bg-purple-300",
                        )}
                        style={{ width: `${Math.round(task.progress * 100)}%` }}
                        aria-hidden
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      <TaskModal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        onSubmit={handleAddTask}
        title="Add New Task"
      />

      {/* Edit Task Modal */}
      <TaskModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSubmit={handleEditTask}
        editTask={editingTask}
        title="Edit Task"
      />
    </>
  )
}
