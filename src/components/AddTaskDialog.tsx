import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { createTask, todayStr, type Task } from "@/lib/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Props {
  onAdd: (task: Task) => void;
}

export default function AddTaskDialog({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [resources, setResources] = useState("");
  const [dateMode, setDateMode] = useState<"today" | "later">("today");
  const [assignedDate, setAssignedDate] = useState<Date | undefined>(new Date());
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);

  const reset = () => {
    setDescription("");
    setResources("");
    setDateMode("today");
    setAssignedDate(new Date());
    setTargetDate(undefined);
  };

  const handleSubmit = () => {
    if (!description.trim() || !targetDate) return;
    const assigned = dateMode === "today" ? todayStr() : assignedDate ? format(assignedDate, "yyyy-MM-dd") : todayStr();
    const task = createTask({
      description: description.trim(),
      resources: resources.trim(),
      assignedDate: assigned,
      targetDate: format(targetDate, "yyyy-MM-dd"),
    });
    onAdd(task);
    reset();
    setOpen(false);
  };

  const minTarget = dateMode === "today" ? new Date() : assignedDate || new Date();

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" placeholder="What needs to be done?" value={description} onChange={(e) => setDescription(e.target.value)} className="resize-none" rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="res">Resources</Label>
            <Input id="res" placeholder="Tools, people, links..." value={resources} onChange={(e) => setResources(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Start Date</Label>
            <RadioGroup value={dateMode} onValueChange={(v) => setDateMode(v as "today" | "later")} className="flex gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="today" id="today" />
                <Label htmlFor="today" className="font-normal cursor-pointer">Today</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="later" id="later" />
                <Label htmlFor="later" className="font-normal cursor-pointer">Schedule later</Label>
              </div>
            </RadioGroup>
            {dateMode === "later" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !assignedDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {assignedDate ? format(assignedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={assignedDate} onSelect={setAssignedDate} disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            )}
          </div>
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !targetDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {targetDate ? format(targetDate, "PPP") : "Pick a due date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={targetDate} onSelect={setTargetDate} disabled={(d) => d < new Date(minTarget.setHours(0, 0, 0, 0))} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => { reset(); setOpen(false); }}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!description.trim() || !targetDate}>Create Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
