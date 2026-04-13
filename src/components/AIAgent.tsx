import { useState, useRef, useEffect } from "react";
import { Bot, Send, Sparkles, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildSystemPrompt, getMemory, updateMemoryFromTask } from "@/lib/ai-memory";
import { createTask, todayStr, daysDiff, type Task } from "@/lib/tasks";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

type Message = { role: "user" | "assistant" | "system"; content: string };

interface Props {
  username: string;
  onTaskCreated: (task: Task) => void;
  existingTasks: Task[];
}

export default function AIAgent({ username, onTaskCreated, existingTasks }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const extractTasks = (text: string): Task[] => {
    const tasks: Task[] = [];
    const regex = /```json\s*([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed.action === "add_task" && parsed.description) {
          const assigned = parsed.assignedDate || todayStr();
          const target = parsed.targetDate || (() => {
            const d = new Date();
            const mem = getMemory(username);
            d.setDate(d.getDate() + mem.averageTaskDuration);
            return d.toISOString().slice(0, 10);
          })();
          const task = createTask({
            description: parsed.description,
            resources: parsed.resources || "",
            assignedDate: assigned,
            targetDate: target,
          });
          tasks.push(task);
          updateMemoryFromTask(username, parsed.description, parsed.resources || "", daysDiff(target, assigned));
        }
      } catch {
        // not valid JSON
      }
    }
    return tasks;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    const memory = getMemory(username);
    const systemPrompt = buildSystemPrompt(memory);

    // Add context about current tasks
    let taskContext = "";
    if (existingTasks.length > 0) {
      const pending = existingTasks.filter((t) => t.status === "pending");
      taskContext = `\n\nCurrent pending tasks (${pending.length}): ${pending
        .slice(0, 5)
        .map((t) => `"${t.description}" (due ${t.targetDate})`)
        .join(", ")}`;
    }

    const apiMessages: Message[] = [
      { role: "system", content: systemPrompt + taskContext },
      ...updatedMessages,
    ];

    let assistantText = "";

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/task-agent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: apiMessages }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || `Error ${response.status}`);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantText += content;
              setMessages([...updatedMessages, { role: "assistant", content: assistantText }]);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Extract and create tasks from the response
      const newTasks = extractTasks(assistantText);
      if (newTasks.length > 0) {
        newTasks.forEach((t) => onTaskCreated(t));
        toast.success(`${newTasks.length} task${newTasks.length > 1 ? "s" : ""} added by AI! 🤖`);
      }
    } catch (err: any) {
      console.error("AI error:", err);
      assistantText = "Sorry, I couldn't process that. Please try again.";
      setMessages([...updatedMessages, { role: "assistant", content: assistantText }]);
      if (err.message?.includes("Rate")) {
        toast.error("Rate limited — please wait a moment");
      } else if (err.message?.includes("402")) {
        toast.error("AI credits exhausted");
      } else {
        toast.error("AI error: " + err.message);
      }
    }

    setLoading(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-primary p-4 text-primary-foreground shadow-lg hover:scale-105 transition-transform"
        title="AI Assistant"
      >
        <Sparkles className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] max-h-[520px] flex flex-col rounded-2xl border bg-card shadow-xl slide-up overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-primary/5">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">TaskFlow AI</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-success/10 text-success font-medium">
            Learning
          </span>
        </div>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8 space-y-2">
            <Sparkles className="h-8 w-8 mx-auto text-primary/40" />
            <p className="font-medium">Hi {username}! 👋</p>
            <p className="text-xs">Tell me what you need to do and I'll create tasks for you. I learn your preferences over time!</p>
            <div className="text-xs space-y-1 pt-2">
              <p className="text-muted-foreground/70">Try: "Finish report by Friday"</p>
              <p className="text-muted-foreground/70">Or: "Buy groceries tomorrow, need car"</p>
            </div>
          </div>
        )}
        {messages.filter((m) => m.role !== "system").map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted rounded-bl-sm"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm max-w-none [&_pre]:bg-muted [&_code]:text-xs [&_p]:my-1">
                  <ReactMarkdown>{msg.content.replace(/```json[\s\S]*?```/g, "✅ *Task created!*")}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-xl px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="Tell me what to do..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={loading}
            className="text-sm"
          />
          <Button size="icon" onClick={sendMessage} disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
