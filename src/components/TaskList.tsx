import React, { useState } from "react";
import { Calendar, CheckCircle2, Circle, Clock, Paperclip, AlertCircle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

// Define strict types matching your Supabase schema
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "completed" | "overdue";
  due_date: string | null;
  assigned_to: string | null;
  subtasks?: { id: string; title: string; is_completed: boolean }[];
  resources?: { id: string; name: string; url: string }[];
}

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (id: string, currentStatus: string) => Promise<void>;
  onUpdateTask: (task: Task) => Promise<void>;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, onToggleComplete, onUpdateTask }) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Grouping logic based on deadlines
  const getGroupedTasks = () => {
    const today = new Date().toISOString().split("T")[0];
    return {
      overdue: tasks.filter((t) => t.status === "overdue" || (t.due_date && t.due_date < today && t.status !== "completed")),
      today: tasks.filter((t) => t.due_date === today && t.status !== "completed"),
      upcoming: tasks.filter((t) => (!t.due_date || t.due_date > today) && t.status !== "completed"),
      completed: tasks.filter((t) => t.status === "completed"),
    };
  };

  const groups = getGroupedTasks();

  const renderSection = (title: string, taskGroup: Task[], icon: React.ReactNode) => {
    if (taskGroup.length === 0) return null;
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3 text-muted-foreground font-medium text-sm px-2">
          {icon}
          <span>{title}</span>
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-mono">{taskGroup.length}</span>
        </div>
        <div className="space-y-1">
          {taskGroup.map((task) => (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className="group flex items-center justify-between p-3.5 rounded-xl bg-card hover:bg-accent/40 border border-transparent hover:border-border transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleComplete(task.id, task.status);
                  }}
                  className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                >
                  {task.status === "completed" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/10" />
                  ) : (
                    <Circle className="w-5 h-5 group-hover:scale-105 transition-transform" />
                  )}
                </div>
                <span className={`text-sm font-semibold truncate tracking-tight ${task.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {task.title}
                </span>
              </div>

              <div className="flex items-center gap-4 shrink-0 text-muted-foreground text-xs">
                {task.resources && task.resources.length > 0 && (
                  <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>{task.resources.length}</span>
                  </div>
                )}
                {task.due_date && (
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium ${task.status === "overdue" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{task.due_date}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {renderSection("Overdue", groups.overdue, <AlertCircle className="w-4 h-4 text-destructive" />)}
      {renderSection("Due Today", groups.today, <Clock className="w-4 h-4 text-amber-500" />)}
      {renderSection("Upcoming Workspace", groups.upcoming, <Calendar className="w-4 h-4 text-primary" />)}
      {renderSection("Completed Tasks", groups.completed, <CheckCircle2 className="w-4 h-4 text-emerald-500" />)}

      {/* Master-Detail Task Sheet View */}
      <Sheet open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        {selectedTask && (
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto border-l border-border bg-background/95 backdrop-blur-md p-6">
            <SheetHeader className="space-y-3 pb-6 border-b border-border">
              <div className="flex items-center gap-2">
                <Badge variant={selectedTask.status === "overdue" ? "destructive" : "secondary"} className="capitalize">
                  {selectedTask.status}
                </Badge>
              </div>
              <SheetTitle className="text-xl font-bold tracking-tight text-foreground">{selectedTask.title}</SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground/90 whitespace-pre-wrap leading-relaxed pt-2">
                {selectedTask.description || "No description provided for this task."}
              </SheetDescription>
            </SheetHeader>

            {/* Subtasks Section */}
            <div className="py-6 border-b border-border">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Subtasks & Checklist</h4>
              {selectedTask.subtasks && selectedTask.subtasks.length > 0 ? (
                <div className="space-y-3">
                  {selectedTask.subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/30 transition-colors">
                      <Checkbox id={subtask.id} checked={subtask.is_completed} />
                      <label htmlFor={subtask.id} className={`text-sm font-medium leading-none cursor-pointer ${subtask.is_completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {subtask.title}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No subtasks created.</p>
              )}
            </div>

            {/* Attachments & Resources */}
            <div className="py-6">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Resources & Reference Links</h4>
              {selectedTask.resources && selectedTask.resources.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {selectedTask.resources.map((res) => (
                    <a
                      key={res.id}
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-muted/30 hover:bg-accent/50 transition-all text-sm font-medium text-foreground group"
                    >
                      <Paperclip className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="truncate flex-1">{res.name}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No resources attached to this task.</p>
              )}
            </div>
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
};
