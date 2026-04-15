import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Copy, Users, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import AssignTaskDialog from "@/components/AssignTaskDialog";
import { formatDate } from "@/lib/tasks";

interface Office {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

interface Member {
  id: string;
  username: string;
  is_online: boolean;
  last_seen: string | null;
}

interface AssignedTask {
  id: string;
  assigned_to: string;
  description: string;
  resources: string;
  target_date: string;
  status: string;
  completed_date: string | null;
}

interface Props {
  username: string;
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function ManagerOffice({ username }: Props) {
  const [offices, setOffices] = useState<Office[]>([]);
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<AssignedTask[]>([]);
  const [newOfficeName, setNewOfficeName] = useState("");
  const [creating, setCreating] = useState(false);

  // Load offices
  useEffect(() => {
    loadOffices();
  }, [username]);

  // Load members & tasks when office selected
  useEffect(() => {
    if (!selectedOffice) return;
    loadMembers();
    loadTasks();

    const memberChannel = supabase
      .channel(`members-${selectedOffice.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "office_members", filter: `office_id=eq.${selectedOffice.id}` }, () => loadMembers())
      .subscribe();

    const taskChannel = supabase
      .channel(`tasks-${selectedOffice.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "assigned_tasks", filter: `office_id=eq.${selectedOffice.id}` }, () => loadTasks())
      .subscribe();

    return () => {
      supabase.removeChannel(memberChannel);
      supabase.removeChannel(taskChannel);
    };
  }, [selectedOffice]);

  async function loadOffices() {
    const { data } = await supabase
      .from("offices")
      .select("*")
      .eq("manager_username", username)
      .order("created_at", { ascending: false });
    if (data) setOffices(data);
  }

  async function loadMembers() {
    if (!selectedOffice) return;
    const { data } = await supabase
      .from("office_members")
      .select("*")
      .eq("office_id", selectedOffice.id);
    if (data) {
      // Mark offline if last_seen > 60s ago
      const now = Date.now();
      setMembers(
        data.map((m) => ({
          ...m,
          is_online: m.last_seen ? now - new Date(m.last_seen).getTime() < 60000 : false,
        }))
      );
    }
  }

  async function loadTasks() {
    if (!selectedOffice) return;
    const { data } = await supabase
      .from("assigned_tasks")
      .select("*")
      .eq("office_id", selectedOffice.id)
      .order("created_at", { ascending: false });
    if (data) setTasks(data);
  }

  async function createOffice() {
    if (!newOfficeName.trim()) return;
    setCreating(true);
    const code = generateCode();
    const { error } = await supabase.from("offices").insert({
      name: newOfficeName.trim(),
      code,
      manager_username: username,
    });
    if (error) {
      toast.error("Failed to create office");
    } else {
      toast.success(`Office created! Code: ${code}`);
      setNewOfficeName("");
      loadOffices();
    }
    setCreating(false);
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied!");
  };

  if (selectedOffice) {
    const pendingTasks = tasks.filter((t) => t.status === "pending");
    const completedTasks = tasks.filter((t) => t.status === "completed");

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedOffice(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg font-bold">{selectedOffice.name}</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Code: <span className="font-mono font-bold">{selectedOffice.code}</span>
              <button onClick={() => copyCode(selectedOffice.code)}><Copy className="h-3 w-3" /></button>
            </p>
          </div>
        </div>

        {/* Members */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" /> Team Members ({members.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No employees have joined yet. Share the code: <span className="font-mono font-bold">{selectedOffice.code}</span></p>
            ) : (
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${m.is_online ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                      <span className="text-sm font-medium">{m.username}</span>
                    </div>
                    <Badge variant={m.is_online ? "default" : "secondary"} className="text-[10px]">
                      {m.is_online ? "Online" : "Offline"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assign Task */}
        {members.length > 0 && (
          <AssignTaskDialog
            officeId={selectedOffice.id}
            members={members}
            managerUsername={username}
            onTaskAssigned={loadTasks}
          />
        )}

        {/* Assigned Tasks */}
        {tasks.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Assigned Tasks ({pendingTasks.length} pending, {completedTasks.length} done)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-2 px-3 rounded-lg border text-sm">
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${t.status === "completed" ? "line-through text-muted-foreground" : ""}`}>{t.description}</p>
                      <p className="text-xs text-muted-foreground">→ {t.assigned_to} · Due {formatDate(t.target_date)}</p>
                    </div>
                    <Badge variant={t.status === "completed" ? "secondary" : "default"} className="text-[10px] ml-2 shrink-0">
                      {t.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold">My Offices</h2>
      </div>

      {/* Create Office */}
      <div className="flex gap-2">
        <Input
          placeholder="Office name..."
          value={newOfficeName}
          onChange={(e) => setNewOfficeName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createOffice()}
        />
        <Button onClick={createOffice} disabled={creating || !newOfficeName.trim()} className="gap-1 shrink-0">
          <Plus className="h-4 w-4" /> Create
        </Button>
      </div>

      {/* Office List */}
      {offices.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            No offices yet. Create one to get started!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {offices.map((office) => (
            <Card
              key={office.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setSelectedOffice(office)}
            >
              <CardContent className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{office.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    Code: <span className="font-mono font-bold">{office.code}</span>
                    <button onClick={(e) => { e.stopPropagation(); copyCode(office.code); }}>
                      <Copy className="h-3 w-3" />
                    </button>
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">View →</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
