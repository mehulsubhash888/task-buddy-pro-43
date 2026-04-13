// AI Agent memory - learns user preferences over time
const MEMORY_KEY = "taskflow_ai_memory";

export interface AIMemory {
  username: string;
  preferredCategories: string[];
  commonResources: string[];
  averageTaskDuration: number; // days
  taskPatterns: { description: string; resources: string; durationDays: number }[];
  interactionCount: number;
  lastUpdated: string;
}

export function getMemory(username: string): AIMemory {
  try {
    const all = JSON.parse(localStorage.getItem(MEMORY_KEY) || "{}");
    return all[username] || {
      username,
      preferredCategories: [],
      commonResources: [],
      averageTaskDuration: 7,
      taskPatterns: [],
      interactionCount: 0,
      lastUpdated: new Date().toISOString(),
    };
  } catch {
    return {
      username,
      preferredCategories: [],
      commonResources: [],
      averageTaskDuration: 7,
      taskPatterns: [],
      interactionCount: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
}

export function saveMemory(memory: AIMemory) {
  try {
    const all = JSON.parse(localStorage.getItem(MEMORY_KEY) || "{}");
    all[memory.username] = { ...memory, lastUpdated: new Date().toISOString() };
    localStorage.setItem(MEMORY_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

export function updateMemoryFromTask(username: string, description: string, resources: string, durationDays: number) {
  const mem = getMemory(username);
  mem.interactionCount++;

  // Track patterns (keep last 20)
  mem.taskPatterns.push({ description, resources, durationDays });
  if (mem.taskPatterns.length > 20) mem.taskPatterns = mem.taskPatterns.slice(-20);

  // Update average duration
  const durations = mem.taskPatterns.map((p) => p.durationDays);
  mem.averageTaskDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);

  // Track common resources
  if (resources) {
    const idx = mem.commonResources.indexOf(resources);
    if (idx === -1) {
      mem.commonResources.push(resources);
      if (mem.commonResources.length > 10) mem.commonResources.shift();
    }
  }

  saveMemory(mem);
}

export function buildSystemPrompt(memory: AIMemory): string {
  let prompt = `You are TaskFlow AI — a smart task assistant. You help users create tasks by understanding their natural language input.

RULES:
- Extract task details from user messages: description, resources needed, start date, due date.
- If information is missing, ask for it conversationally. Don't guess dates unless the user implies them.
- When you have enough info, respond with a JSON block in this exact format:
\`\`\`json
{"action":"add_task","description":"...","resources":"...","assignedDate":"YYYY-MM-DD","targetDate":"YYYY-MM-DD"}
\`\`\`
- "today" or "now" means today's date. "tomorrow" means +1 day. "next week" means +7 days. "in X days" means +X days.
- Today's date is: ${new Date().toISOString().slice(0, 10)}
- If the user asks something unrelated to tasks, respond helpfully but briefly.
- Be friendly, concise, and adaptive. Match the user's communication style.
- You can add multiple tasks if the user describes multiple things.`;

  if (memory.interactionCount > 0) {
    prompt += `\n\nUSER PROFILE (learned over ${memory.interactionCount} interactions):`;
    if (memory.averageTaskDuration) {
      prompt += `\n- Their tasks typically span ${memory.averageTaskDuration} days. If they don't specify a due date, suggest this.`;
    }
    if (memory.commonResources.length > 0) {
      prompt += `\n- Common resources they use: ${memory.commonResources.slice(-5).join(", ")}`;
    }
    if (memory.taskPatterns.length > 0) {
      const recent = memory.taskPatterns.slice(-3);
      prompt += `\n- Recent task patterns: ${recent.map((p) => `"${p.description}" (${p.durationDays}d)`).join(", ")}`;
    }
  }

  return prompt;
}
