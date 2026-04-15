import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getOfficeId } from "@/lib/local-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, LogOut } from "lucide-react";
import { toast } from "sonner";
import { formatDate, todayStr } from "@/lib/tasks";

interface AssignedTask {
  id: string;
  description: string;
  resources: string;
  assigned_by: string;
  assigned_date: string;
  target_date: string;
  completed_date: string | null;
  status: string;
}

interface Props {
  username: string;
  onLogout: () => void;
}

export default function EmployeeView({ username, onLogout }: Props) {
  const [officeId, setOfficeId] = useState<string | null>(getOfficeId());
  const [officeCode, setOfficeCode] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [tasks, setTasks] = useState<AssignedTask[]>([]);
  const [joining, setJoining] = useState(false);

  // Heartbeat: update online status every 30s
  useEffect(() => {
    if (!officeId) return;
    const heartbeat = async () => {
      await supabase
        .from("office_members")
        .update({ is_online: true, last_seen: new Date().toISOString() })
        .eq("office_id", officeId)
        .eq("username", username);
    };
    heartbeat();
    const interval = setInterval(heartbeat, 30000);

    // Go offline on unmount
    return () => {
      clearInterval(interval);
      supabase
        .from("office_members")
        .update({ is_online: false })
        .eq("office_id", officeId)
        .eq("username", username);
    };
  }, [officeId, username]);

  // Load tasks & listen for realtime
  useEffect(() => {
    if (!officeId) return;
    loadTasks();
    loadOfficeName();

    const channel = supabase
      .channel(`emp-tasks-${officeId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "assigned_tasks", filter: `office_id=eq.${officeId}` }, () => loadTasks())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [officeId]);

  async function loadOfficeName() {
    if (!officeId) return;
    const { data } = await supabase.from("offices").select("name").eq("id", officeId).single();
    if (data) setOfficeName(data.name);
  }

  async function loadTasks() {
    if (!officeId) return;
    const { data } = await supabase
      .from("assigned_tasks")
      .select("*")
      .eq("office_id", officeId)
      .eq("assigned_to", username)
      .order("created_at", { ascending: false });
    if (data) setTasks(data);
  }

  async function joinOffice() {
    if (!officeCode.trim()) return;
    setJoining(true);
    const { data: office } = await supabase
      .from("offices")
      .select("id, name")
      .eq("code", officeCode.trim().toUpperCase())
      .single();

    if (!office) {
      toast.error("Invalid office code");
      setJoining(false);
      return;
    }

    const { error } = await supabase.from("office_members").insert({
      office_id: office.id,
      username,
      is_online: true,
      last_seen: new Date().toISOString(),
    });

    if (error?.code === "23505") {
      // Already a member, just update
      await supabase
        .from("office_members")
        .update({ is_online: true, last_seen: new Date().toISOString() })
        .eq("office_id", office.id)
        .eq("username", username);
    } else if (error) {
      toast.error("Failed to join office");
      setJoining(false);
      return;
    }

    // Save officeId
    localStorage.setItem("taskflow_office_id", office.id);
    setOfficeId(office.id);
    setOfficeName(office.name);
    toast.success(`Joined ${office.name}!`);
    setJoining(false);
  }

  async function completeTask(taskId: string) {
    await supabase
      .from("assigned_tasks")
      .update({ status: "completed", completed_date: todayStr() })
      .eq("id", taskId);
    toast.success("Task completed! 🎉");
    loadTasks();
  }

  // Join screen
  if (!officeId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6 slide-up">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Join an Office</h1>
            <p className="text-sm text-muted-foreground">Enter the code your manager shared with you</p>
          </div>
          <div className="space-y-3">
            <Input
              placeholder="Enter 6-character code"
              value={officeCode}
              onChange={(e) => setOfficeCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && joinOffice()}
              maxLength={6}
              className="text-center text-lg font-mono tracking-widest"
            />
            <Button onClick={joinOffice} disabled={joining || officeCode.length < 6} className="w-full">
              Join Office
            </Button>
          </div>
          <button onClick={onLogout} className="text-sm text-muted-foreground hover:underline w-full text-center">
            ← Back to role selection
          </button>
        </div>
      </div>
    );
  }

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-3xl mx-auto flex items-center justify-between h-14 px-4">
          <div>
            <h1 className="text-lg font-bold leading-none">{officeName}</h1>
            <p className="text-xs text-muted-foreground">Logged in as {username}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onLogout} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold">{pendingTasks.length}</p>
              <p className="text-xs text-muted-foreground">Pending Tasks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold">{completedTasks.length}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Tasks */}
        {pendingTasks.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" /> Pending Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingTasks.map((t) => (
                <div key={t.id} className="flex items-start justify-between py-2 px-3 rounded-lg border gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{t.description}</p>
                    {t.resources && <p className="text-xs text-muted-foreground mt-0.5">{t.resources}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      From: {t.assigned_by} · Due: {formatDate(t.target_date)}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0 gap-1" onClick={() => completeTask(t.id)}>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Done
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Completed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {completedTasks.map((t) => (
                <div key={t.id} className="py-2 px-3 rounded-lg border text-sm opacity-70">
                  <p className="line-through">{t.description}</p>
                  <p className="text-xs text-muted-foreground">Completed {t.completed_date ? formatDate(t.completed_date) : ""}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {tasks.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground text-sm">
              No tasks assigned yet. Your manager will assign tasks to you.
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
