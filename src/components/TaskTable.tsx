import { useState } from "react";
import { Check, Trash2, ArrowUpDown, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { formatDate, daysDiff, sortTasks, type Task, type SubTask, type SortOption } from "@/lib/tasks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Props {
  tasks: Task[];
  onComplete: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdateTask: (updated: Task) => void;
}

export default function TaskTable({ tasks, onComplete, onRemove, onUpdateTask }: Props) {
  const [sort, setSort] = useState<SortOption>("default");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [newSubtaskText, setNewSubtaskText] = useState<Record<string, string>>({});
  const sorted = sortTasks(tasks, sort);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const addSubtask = (taskId: string) => {
    const text = newSubtaskText[taskId]?.trim();
    if (!text) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const subtask: SubTask = { id: crypto.randomUUID(), description: text, status: "pending" };
    onUpdateTask({ ...task, subtasks: [...(task.subtasks || []), subtask] });
    setNewSubtaskText((prev) => ({ ...prev, [taskId]: "" }));
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const subtasks = (task.subtasks || []).map((s) =>
      s.id === subtaskId ? { ...s, status: s.status === "completed" ? "pending" as const : "completed" as const } : s
    );
    onUpdateTask({ ...task, subtasks });
  };

  const removeSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    onUpdateTask({ ...task, subtasks: (task.subtasks || []).filter((s) => s.id !== subtaskId) });
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground fade-in">
        <div className="rounded-full bg-muted p-6 mb-4">
          <Check className="h-8 w-8" />
        </div>
        <p className="text-lg font-medium">No tasks yet</p>
        <p className="text-sm">Click "Add Task" to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 fade-in">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {tasks.filter((t) => t.status === "pending").length} pending · {tasks.filter((t) => t.status === "completed").length} completed
        </p>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default order</SelectItem>
              <SelectItem value="dueDate">Due date</SelectItem>
              <SelectItem value="assignedDate">Start date</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-12">#</TableHead>
              <TableHead className="w-8"></TableHead>
              <TableHead className="w-10"></TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="hidden md:table-cell">Resources</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((task, i) => {
              const days = daysDiff(task.targetDate);
              const isOverdue = task.status === "pending" && days < 0;
              const isDueToday = task.status === "pending" && days === 0;
              const isDueSoon = task.status === "pending" && days > 0 && days <= 3;
              const isExpanded = expandedRows.has(task.id);
              const subtasks = task.subtasks || [];
              const completedSubs = subtasks.filter((s) => s.status === "completed").length;

              // Priority color matching C reminder thresholds: overdue, 0, 1-3, 4-7, 8-14, >14
              const priorityColor = task.status === "completed"
                ? "bg-muted"
                : isOverdue
                ? "bg-[hsl(var(--priority-critical))]"
                : isDueToday
                ? "bg-[hsl(var(--priority-high))]"
                : isDueSoon
                ? "bg-[hsl(var(--priority-medium))]"
                : days <= 7
                ? "bg-[hsl(var(--priority-low))]"
                : days <= 14
                ? "bg-[hsl(var(--priority-safe))]"
                : "bg-muted-foreground/30";

              const priorityLabel = task.status === "completed"
                ? "Done"
                : isOverdue
                ? `${Math.abs(days)}d overdue`
                : isDueToday
                ? "Due today"
                : isDueSoon
                ? `${days}d left`
                : days <= 7
                ? `${days}d left`
                : days <= 14
                ? `${days}d left`
                : `${days}d left`;

              return (
                <>
                  <TableRow
                    key={task.id}
                    className={`task-row-enter transition-colors ${task.status === "completed" ? "opacity-60" : ""}`}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onRemove(task.id)}
                        title="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleRow(task.id)}
                          className="p-0.5 rounded hover:bg-muted transition-colors"
                        >
                          {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                        </button>
                        <span className={task.status === "completed" ? "line-through" : "font-medium"}>
                          {task.description}
                        </span>
                        {subtasks.length > 0 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({completedSubs}/{subtasks.length})
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-[200px] truncate">
                      {task.resources || "—"}
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(task.assignedDate)}</TableCell>
                    <TableCell className="text-sm">
                      <span className={isOverdue ? "text-destructive font-semibold" : isDueToday ? "text-warning font-semibold" : isDueSoon ? "text-primary font-medium" : ""}>
                        {formatDate(task.targetDate)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {task.status === "completed" ? (
                        <Badge variant="secondary" className="bg-success/10 text-success border-0 text-xs">
                          Completed
                        </Badge>
                      ) : isOverdue ? (
                        <Badge variant="destructive" className="text-xs">Overdue</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {task.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-success hover:text-success hover:bg-success/10"
                          onClick={() => onComplete(task.id)}
                          title="Mark complete"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow key={`${task.id}-subtasks`} className="bg-muted/20 hover:bg-muted/20">
                      <TableCell colSpan={8} className="py-2 px-4">
                        <div className="pl-10 space-y-1.5">
                          {subtasks.map((sub) => (
                            <div key={sub.id} className="flex items-center gap-2 group py-1">
                              <Checkbox
                                checked={sub.status === "completed"}
                                onCheckedChange={() => toggleSubtask(task.id, sub.id)}
                                className="h-3.5 w-3.5"
                              />
                              <span className={`text-sm flex-1 ${sub.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                                {sub.description}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                                onClick={() => removeSubtask(task.id, sub.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          <div className="flex items-center gap-2 pt-1">
                            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              placeholder="Add subtask..."
                              value={newSubtaskText[task.id] || ""}
                              onChange={(e) => setNewSubtaskText((prev) => ({ ...prev, [task.id]: e.target.value }))}
                              onKeyDown={(e) => e.key === "Enter" && addSubtask(task.id)}
                              className="h-7 text-sm border-dashed"
                            />
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => addSubtask(task.id)}>
                              Add
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
