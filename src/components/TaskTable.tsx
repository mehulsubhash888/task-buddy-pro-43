import { useState } from "react";
import { Check, Trash2, ArrowUpDown } from "lucide-react";
import { formatDate, daysDiff, sortTasks, type Task, type SortOption } from "@/lib/tasks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface Props {
  tasks: Task[];
  onComplete: (id: string) => void;
  onRemove: (id: string) => void;
}

export default function TaskTable({ tasks, onComplete, onRemove }: Props) {
  const [sort, setSort] = useState<SortOption>("default");
  const sorted = sortTasks(tasks, sort);

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
              <TableHead>Description</TableHead>
              <TableHead className="hidden md:table-cell">Resources</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((task, i) => {
              const days = daysDiff(task.targetDate);
              const isOverdue = task.status === "pending" && days < 0;
              const isDueToday = task.status === "pending" && days === 0;
              const isDueSoon = task.status === "pending" && days > 0 && days <= 3;

              return (
                <TableRow
                  key={task.id}
                  className={`task-row-enter transition-colors ${
                    task.status === "completed" ? "opacity-60" : ""
                  }`}
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">{i + 1}</TableCell>
                  <TableCell>
                    <span className={task.status === "completed" ? "line-through" : "font-medium"}>
                      {task.description}
                    </span>
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
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onRemove(task.id)}
                        title="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
