import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Bot, User, CornerDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: Date;
}

export const AIAgent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "agent",
      text: "Hello! I am Task Buddy. Tell me what needs to be done, and I will construct your workspace tasks instantly.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      sender: "user",
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Simulate AI response logic (Hook your real processing/Supabase trigger function here)
    setTimeout(() => {
      const systemResponse: Message = {
        id: crypto.randomUUID(),
        sender: "agent",
        text: `Understood. Analyzing requirement: "${input}". I am processing this task layout structure for your pipeline.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, systemResponse]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-sm border-l border-border bg-card/40 backdrop-blur-xl">
      {/* Sidebar Header */}
      <div className="flex items-center gap-2.5 p-4 border-b border-border bg-card">
        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
          <Sparkles className="w-4 h-4 fill-primary/10" />
        </div>
        <div>
          <h3 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-1.5">
            AI Task Agent
          </h3>
          <p className="text-[11px] text-muted-foreground">Natural language pipeline driver</p>
        </div>
      </div>

      {/* Chat History Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
              <div className={`p-2 rounded-lg shrink-0 h-8 w-8 flex items-center justify-center border ${msg.sender === "user" ? "bg-background border-border" : "bg-primary/10 border-primary/20 text-primary"}`}>
                {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`p-3 rounded-2xl text-xs leading-relaxed font-medium shadow-sm ${msg.sender === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted text-foreground rounded-tl-none"}`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Command Input Bar */}
      <div className="p-4 border-t border-border bg-card">
        <div className="relative flex items-center rounded-xl border border-border bg-background focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Assign task to..."
            className="w-full bg-transparent pl-3 pr-12 py-3 text-xs font-medium focus:outline-none text-foreground placeholder:text-muted-foreground/60"
          />
          <div className="absolute right-2 flex items-center gap-1.5">
            <span className="hidden sm:flex items-center text-[10px] font-mono text-muted-foreground/50 border border-border px-1.5 py-0.5 rounded bg-muted">
              <CornerDownLeft className="w-2.5 h-2.5" />
            </span>
            <Button size="icon" variant="ghost" onClick={handleSend} className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
