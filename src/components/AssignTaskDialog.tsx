import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ClipboardPlus } from "lucide-react";
import { toast } from "sonner";
import { todayStr } from "@/lib/tasks";

interface Props {
  officeId: string;
  members: { username: string }[];
  managerUsername: string;
  onTaskAssigned: () => void;
}

export default function AssignTaskDialog({ officeId, members, managerUsername, onTaskAssigned }: Props) {
  const [open, setOpen] = useState(false);
  const [assignTo, setAssignTo] = useState("");
  const [description, setDescription] = useState("");
  const [resources, setResources] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAssign = async () => {
    if (!assignTo || !description.trim() || !targetDate) return;
    setLoading(true);
    const { error } = await supabase.from("assigned_tasks").insert({
      office_id: officeId,
      assigned_to: assignTo,
      assigned_by: managerUsername,
      description: description.trim(),
      resources: resources.trim(),
      assigned_date: todayStr(),
      target_date: targetDate,
    });
    if (error) {
      toast.error("Failed to assign task");
    } else {
      toast.success(`Task assigned to ${assignTo}`);
      setOpen(false);
      setDescription("");
      setResources("");
      setTargetDate("");
      setAssignTo("");
      onTaskAssigned();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2">
          <ClipboardPlus className="h-4 w-4" /> Assign Task to Employee
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Assign to</Label>
            <Select value={assignTo} onValueChange={setAssignTo}>
              <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.username} value={m.username}>{m.username}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Task Description</Label>
            <Textarea
              placeholder="What needs to be done..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Resources / Notes</Label>
            <Input
              placeholder="Links, references..."
              value={resources}
              onChange={(e) => setResources(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Deadline</Label>
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              min={todayStr()}
            />
          </div>
          <Button onClick={handleAssign} disabled={loading || !assignTo || !description.trim() || !targetDate} className="w-full">
            Assign Task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
