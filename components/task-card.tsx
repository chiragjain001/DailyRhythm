"use client";

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence, PanInfo } from "framer-motion"
import { Check, Edit2, Trash2, Mic, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"


interface Task {
  id: string
  title: string
  assignee?: string
  time?: string
  priority: "important" | "today" | "habit" | string
  progress: number
  completed: boolean
}

interface TaskCardProps {
  task: Task
  onToggleComplete: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  dragControls?: any
}

export function TaskCard({ task, onToggleComplete, onEdit, onDelete, dragControls }: TaskCardProps) {
  const [isCompleting, setIsCompleting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [isRevealed, setIsRevealed] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Handle drag to complete
  const handleDragEnd = (event: any, info: PanInfo) => {
    const dragThreshold = 100
    if (info.offset.x > dragThreshold && !task.completed) {
      setIsCompleting(true)
      setTimeout(() => {
        onToggleComplete(task.id)
        setIsCompleting(false)
      }, 800)
    }
    setDragOffset(0)
    setIsDragging(false)
  }

  const handleDrag = (event: any, info: PanInfo) => {
    if (info.offset.x > 0 && !task.completed) {
      setDragOffset(info.offset.x)
      if (!isDragging) {
        setIsDragging(true)
      }
    }
  }

  // Handle delete animation
  const handleDelete = () => {
    setIsDeleting(true)
    setTimeout(() => {
      onDelete(task.id)
    }, 500)
  }

  // Handle edit
  const handleEdit = () => {
    onEdit(task.id)
  }

  const handleEditSubmit = (data: any) => {
    // no longer used here
  }

  const handleEditCancel = () => {
    // no longer used here
  }

  // Handle card click to reveal/hide actions
  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsRevealed(!isRevealed)
  }

  // Handle click outside to hide actions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setIsRevealed(false)
      }
    }

    if (isRevealed) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isRevealed])

  // No animation for delete, just remove immediately

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative cursor-pointer"
      onClick={handleCardClick}
      onHoverStart={() => setIsHovering(true)}
      onHoverEnd={() => setIsHovering(false)}
      whileHover={{ scale: 1.01, y: -1 }}
      whileTap={{ scale: 0.99 }}
    >
          {/* Completion Animation Overlay */}
          <AnimatePresence>
            {isCompleting && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-gradient-to-r from-green-400 to-green-500"
              >
                <motion.div
                  initial={{ scale: 0, rotateY: 0 }}
                  animate={{ scale: 1, rotateY: 360 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="flex items-center gap-3 text-white"
                >
                  <Check className="h-8 w-8" />
                  <span className="text-lg font-semibold">Completed!</span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            className={cn(
              "rounded-2xl border border-neutral-100 p-4 shadow-sm h-[10vh] transition-all duration-200",
              isCompleting && "pointer-events-none",
              isRevealed && !task.completed && "ring-2 ring-blue-200"
            )}
            animate={{
              background: task.completed 
                ? "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 50%, #86efac 100%)"
                : dragOffset > 50 
                ? "#dcfce7" 
                : isRevealed 
                ? "#eff6ff" 
                : "#ffffff",
              borderColor: task.completed ? "#86efac" : "#e5e5e5"
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                {/* Drag Handle - Only show when revealed */}
                <AnimatePresence>
                  {isRevealed && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ 
                        opacity: 1, 
                        x: dragOffset > 0 ? dragOffset * 0.3 : 0,
                        rotate: dragOffset > 50 ? 15 : 0
                      }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="flex items-center gap-2"
                      drag="x"
                      dragConstraints={{ left: 0, right: 200 }}
                      dragElastic={0.1}
                      onDrag={handleDrag}
                      onDragEnd={handleDragEnd}
                    >
                      <motion.div
                        className="relative"
                        animate={{
                          x: !isDragging && !task.completed ? [
                            0, 
                            isHovering ? 8 : 4, 
                            0
                          ] : 0,
                          scale: isHovering && !isDragging ? 1.1 : 1
                        }}
                        transition={{
                          x: {
                            duration: isHovering ? 1.5 : 2.5,
                            repeat: !isDragging && !task.completed ? Infinity : 0,
                            repeatDelay: isHovering ? 1 : 2,
                            ease: "easeInOut"
                          },
                          scale: {
                            duration: 0.2,
                            ease: "easeOut"
                          }
                        }}
                      >
                        <GripVertical className="h-5 w-5 text-neutral-400 cursor-grab active:cursor-grabbing" />
                        {/* Pulsing glow effect */}
                        <motion.div
                          className="absolute inset-0 rounded-md bg-lime-400/20"
                          animate={{
                            opacity: !isDragging && !task.completed ? [
                              0, 
                              isHovering ? 0.6 : 0.3, 
                              0
                            ] : 0,
                            scale: !isDragging && !task.completed ? [
                              0.8, 
                              1.2, 
                              0.8
                            ] : 0.8
                          }}
                          transition={{
                            duration: isHovering ? 1.5 : 2.5,
                            repeat: !isDragging && !task.completed ? Infinity : 0,
                            repeatDelay: isHovering ? 1 : 2,
                            ease: "easeInOut"
                          }}
                        />
                      </motion.div>
                      <motion.button
                        aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleComplete(task.id)
                        }}
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-lime-300 transition-all relative z-10",
                          task.completed ? "bg-lime-400 text-[#1F2F4A]" : "bg-white text-neutral-400"
                        )}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        animate={{
                          scale: dragOffset > 50 ? 1.2 : 1,
                          backgroundColor: dragOffset > 50 ? "#84cc16" : task.completed ? "#a3e635" : "#ffffff",
                          boxShadow: !isDragging && !task.completed && isHovering ? 
                            "0 0 20px rgba(163, 230, 53, 0.4)" : 
                            "0 0 0px rgba(163, 230, 53, 0)"
                        }}
                        transition={{
                          boxShadow: { duration: 0.3, ease: "easeInOut" }
                        }}
                      >
                        <Check className="h-4 w-4" />
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={cn(
                      "text-sm font-medium truncate transition-all",
                      task.completed ? "text-neutral-500 line-through" : "text-neutral-900"
                    )}>
                      {task.title}
                    </p>
                    {/* Priority indicator */}
                    <motion.div
                      className={cn(
                        "ml-2 h-2 w-2 rounded-full flex-shrink-0",
                        task.priority === "important" ? "bg-red-400" : 
                        task.priority === "today" ? "bg-lime-400" : "bg-purple-300"
                      )}
                      animate={{ scale: isRevealed ? 1.2 : 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    />
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-neutral-500">
                    <Mic className="h-3.5 w-3.5" />
                    <span>{task.assignee ?? "—"}</span>
                    {task.time && (
                      <>
                        <span>•</span>
                        <span>{task.time}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons - Only show when revealed */}
              <AnimatePresence>
                {isRevealed && (
                  <motion.div
                    initial={{ opacity: 0, x: 20, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
                    className="flex items-center gap-2"
                  >
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-full bg-pink-100 text-pink-700 hover:bg-pink-200 h-9 w-9 md:h-8 md:w-8"
                        aria-label="Edit"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit()
                        }}
                      >
                        <Edit2 className="h-4 w-4 md:h-3 md:w-3" />
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:bg-red-50 hover:text-red-600 h-9 w-9 md:h-8 md:w-8"
                        aria-label="Delete"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete()
                        }}
                      >
                        <Trash2 className="h-4 w-4 md:h-3 md:w-3" />
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white">
              <motion.div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  task.priority === "important" ? "bg-red-400" : 
                  task.priority === "today" ? "bg-lime-400" : "bg-purple-300"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${Math.round(task.progress * 100)}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>

            {/* Drag Indicator */}
            <AnimatePresence>
              {dragOffset > 20 && !task.completed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-green-600"
                >
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    <span className="text-xs font-medium">
                      {dragOffset > 50 ? "Release to complete!" : "Keep dragging →"}
                    </span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Subtle hint text when revealed but not dragging */}
            <AnimatePresence>
              {isRevealed && !isDragging && !task.completed && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 0.6, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  className="absolute left-4 bottom-1 text-xs text-neutral-400 pointer-events-none"
                >
                  <motion.span
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    Drag to complete →
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
    </motion.div>
  )
}
