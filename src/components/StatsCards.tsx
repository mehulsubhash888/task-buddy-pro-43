import { CheckCircle2, Clock, AlertTriangle, ListTodo } from "lucide-react";
import type { Task } from "@/lib/tasks";
import { daysDiff } from "@/lib/tasks";

interface Props {
  tasks: Task[];
}

export default function StatsCards({ tasks }: Props) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const pending = tasks.filter((t) => t.status === "pending").length;
  const overdue = tasks.filter((t) => t.status === "pending" && daysDiff(t.targetDate) < 0).length;

  const stats = [
    { label: "Total", value: total, icon: ListTodo, color: "text-primary", bg: "bg-primary/10" },
    { label: "Pending", value: pending, icon: Clock, color: "text-warning", bg: "bg-warning/10" },
    { label: "Completed", value: completed, icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
    { label: "Overdue", value: overdue, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl border bg-card p-4 shadow-sm slide-up">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{s.label}</span>
            <div className={`rounded-lg p-1.5 ${s.bg}`}>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
          </div>
          <p className="text-2xl font-bold">{s.value}</p>
        </div>
      ))}
    </div>
  );
}
