import { useState, useEffect } from "react";
import { loadTasks, saveTasks, todayStr, type Task } from "@/lib/tasks";
import { getSession, getRole, setRole as saveRole, logout, type UserRole } from "@/lib/local-auth";
import AddTaskDialog from "@/components/AddTaskDialog";
import { TaskList } from "@/components/TaskList"; // <-- Updated import
import StatsCards from "@/components/StatsCards";
import AuthScreen from "@/components/AuthScreen";
import { AIAgent } from "@/components/AIAgent"; // <-- Updated import
import RoleSelectScreen from "@/components/RoleSelectScreen";
import ManagerOffice from "@/components/ManagerOffice";
import EmployeeView from "@/components/EmployeeView";
import { toast } from "sonner";
import { ClipboardList, LogOut, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Index() {
  const [user, setUser] = useState<string | null>(null);
  const [role, setRoleState] = useState<UserRole | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const session = getSession();
    const savedRole = getRole();
    setUser(session);
    setRoleState(savedRole);
    setAuthChecked(true);
    if (session) {
      setTasks(loadTasks());
    }
  }, []);

  const persist = (updated: Task[]) => {
    setTasks(updated);
    saveTasks(updated);
  };

  const handleAuth = () => {
    const session = getSession();
    setUser(session);
    setTasks(loadTasks());
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setRoleState(null);
    setTasks([]);
    toast("Signed out");
  };

  const handleRoleSelect = (r: UserRole) => {
    saveRole(r);
    setRoleState(r);
  };

  const handleAdd = (task: Task) => {
    persist([...tasks, task]);
    toast.success("Task added");
  };

  const handleToggleComplete = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    persist(
      tasks.map((t) =>
        t.id === id ? { ...t, status: newStatus as any, completedDate: newStatus === "completed" ? todayStr() : null } : t
      )
    );
    if (newStatus === "completed") toast.success("Task completed 🎉");
  };

  const handleUpdateTask = async (updated: Task) => {
    persist(tasks.map((t) => (t.id === updated.id ? updated : t)));
  };

  if (!authChecked) return null;

  // Step 1: Role selection
  if (!role) return <RoleSelectScreen onSelectRole={handleRoleSelect} />;

  // Step 2: Auth
  if (!user) return <AuthScreen onAuth={handleAuth} role={role} onBack={() => { setRoleState(null); logout(); }} />;

  // Step 3: Employee view
  if (role === "employee") return <EmployeeView username={user} onLogout={handleLogout} />;

  // Step 4: Manager view with New Workspace Layout
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      
      {/* Main Content Area (Left side) */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="w-full max-w-5xl mx-auto flex items-center justify-between h-16 px-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary p-2">
                <ClipboardList className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-none">Task Buddy Pro</h1>
                <p className="text-xs text-muted-foreground">Manager: {user}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AddTaskDialog onAdd={handleAdd} />
              <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" /> Sign Out
              </Button>
            </div>
          </div>
        </header>

        <main className="w-full max-w-5xl mx-auto px-6 py-6 space-y-6">
          <Tabs defaultValue="tasks">
            <TabsList className="w-full max-w-md">
              <TabsTrigger value="tasks" className="flex-1 gap-2">
                <ClipboardList className="h-4 w-4" /> Workspace
              </TabsTrigger>
              <TabsTrigger value="offices" className="flex-1 gap-2">
                <Building2 className="h-4 w-4" /> Team Offices
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="tasks" className="space-y-6 mt-6">
              <StatsCards tasks={tasks} />
              {/* Replacing TaskTable with the new TaskList */}
              <TaskList 
                tasks={tasks as any} 
                onToggleComplete={handleToggleComplete} 
                onUpdateTask={handleUpdateTask} 
              />
            </TabsContent>
            
            <TabsContent value="offices" className="mt-6">
              <ManagerOffice username={user} />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* AI Agent Sidebar (Right side) */}
      <div className="hidden lg:block w-[380px] h-full shrink-0 shadow-xl z-20">
        <AIAgent />
      </div>
    </div>
  );
}
