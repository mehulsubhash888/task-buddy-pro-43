import { AlertTriangle, Clock, Bell } from "lucide-react";
import type { Task } from "@/lib/tasks";
import { getReminders } from "@/lib/tasks";

interface Props {
  tasks: Task[];
}

export default function ReminderBanner({ tasks }: Props) {
  const reminders = getReminders(tasks);
  if (reminders.length === 0) return null;

  return (
    <div className="space-y-2 slide-up">
      {reminders.map(({ task, days, type }) => (
        <div
          key={task.id}
          className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium ${
            type === "overdue"
              ? "bg-destructive/10 text-destructive"
              : type === "due_today"
              ? "bg-warning/10 text-warning-foreground"
              : "bg-primary/5 text-primary"
          }`}
        >
          {type === "overdue" ? (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          ) : type === "due_today" ? (
            <Clock className="h-4 w-4 shrink-0" />
          ) : (
            <Bell className="h-4 w-4 shrink-0" />
          )}
          <span className="truncate">
            {type === "overdue"
              ? `Overdue by ${days} day${days !== 1 ? "s" : ""}: ${task.description}`
              : type === "due_today"
              ? `Due today: ${task.description}`
              : `Due in ${days} day${days !== 1 ? "s" : ""}: ${task.description}`}
          </span>
        </div>
      ))}
    </div>
  );
}
