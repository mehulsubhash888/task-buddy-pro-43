import { useState, useEffect } from "react";
import { loadTasks, saveTasks, todayStr, type Task } from "@/lib/tasks";
import AddTaskDialog from "@/components/AddTaskDialog";
import ReminderBanner from "@/components/ReminderBanner";
import TaskTable from "@/components/TaskTable";
import StatsCards from "@/components/StatsCards";
import { toast } from "sonner";
import { ClipboardList } from "lucide-react";

export default function Index() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    setTasks(loadTasks());
  }, []);

  const persist = (updated: Task[]) => {
    setTasks(updated);
    saveTasks(updated);
  };

  const handleAdd = (task: Task) => {
    persist([...tasks, task]);
    toast.success("Task added");
  };

  const handleComplete = (id: string) => {
    persist(
      tasks.map((t) =>
        t.id === id ? { ...t, status: "completed" as const, completedDate: todayStr() } : t
      )
    );
    toast.success("Task completed 🎉");
  };

  const handleRemove = (id: string) => {
    persist(tasks.filter((t) => t.id !== id));
    toast("Task removed");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-5xl mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary p-2">
              <ClipboardList className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">TaskFlow</h1>
              <p className="text-xs text-muted-foreground">Stay on track</p>
            </div>
          </div>
          <AddTaskDialog onAdd={handleAdd} />
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-6 space-y-6">
        <StatsCards tasks={tasks} />
        <ReminderBanner tasks={tasks} />
        <TaskTable tasks={tasks} onComplete={handleComplete} onRemove={handleRemove} />
      </main>
    </div>
  );
}
