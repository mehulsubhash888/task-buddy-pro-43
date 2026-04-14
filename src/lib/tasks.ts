export type TaskStatus = "pending" | "completed";

export interface SubTask {
  id: string;
  description: string;
  status: TaskStatus;
}

export interface Task {
  id: string;
  description: string;
  resources: string;
  assignedDate: string; // YYYY-MM-DD
  targetDate: string;
  completedDate: string | null;
  status: TaskStatus;
  subtasks?: SubTask[];
}

const STORAGE_KEY = "taskmanager_tasks";

export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function createTask(data: Pick<Task, "description" | "resources" | "assignedDate" | "targetDate">): Task {
  return {
    id: crypto.randomUUID(),
    ...data,
    completedDate: null,
    status: "pending",
  };
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysDiff(target: string, from?: string): number {
  const t = new Date(target + "T00:00:00").getTime();
  const f = from ? new Date(from + "T00:00:00").getTime() : new Date(new Date().toISOString().slice(0, 10) + "T00:00:00").getTime();
  return Math.round((t - f) / (1000 * 60 * 60 * 24));
}

export function getReminders(tasks: Task[]): { task: Task; days: number; type: "overdue" | "due_today" | "upcoming" }[] {
  const today = todayStr();
  const reminderDays = [14, 10, 7, 4, 3, 2, 1, 0];
  const results: { task: Task; days: number; type: "overdue" | "due_today" | "upcoming" }[] = [];

  for (const task of tasks) {
    if (task.status === "completed") continue;
    if (task.assignedDate > today) continue;

    const days = daysDiff(task.targetDate);
    if (days < 0) {
      results.push({ task, days: Math.abs(days), type: "overdue" });
    } else if (reminderDays.includes(days)) {
      results.push({ task, days, type: days === 0 ? "due_today" : "upcoming" });
    }
  }

  return results.sort((a, b) => {
    const order = { overdue: 0, due_today: 1, upcoming: 2 };
    return order[a.type] - order[b.type] || a.days - b.days;
  });
}

export type SortOption = "default" | "dueDate" | "status" | "assignedDate";

export function sortTasks(tasks: Task[], sort: SortOption): Task[] {
  const copy = [...tasks];
  switch (sort) {
    case "dueDate":
      return copy.sort((a, b) => a.targetDate.localeCompare(b.targetDate));
    case "status":
      return copy.sort((a, b) => {
        if (a.status === b.status) return a.targetDate.localeCompare(b.targetDate);
        return a.status === "pending" ? -1 : 1;
      });
    case "assignedDate":
      return copy.sort((a, b) => a.assignedDate.localeCompare(b.assignedDate));
    default:
      return copy;
  }
}
