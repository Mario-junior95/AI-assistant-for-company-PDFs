import { generateChatReply } from "@/lib/ai/chat";
import type { ChatMessage } from "@/lib/ai/types";

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = (body as { messages?: unknown }).messages;
  if (!Array.isArray(raw) || raw.length === 0) {
    return Response.json({ error: "messages array required" }, { status: 400 });
  }

  const messages: ChatMessage[] = [];
  for (const item of raw) {
    if (
      typeof item !== "object" ||
      item === null ||
      !("role" in item) ||
      !("content" in item)
    ) {
      return Response.json({ error: "Invalid message shape" }, { status: 400 });
    }
    const { role, content } = item as { role: string; content: string };
    if (
      (role !== "user" && role !== "assistant") ||
      typeof content !== "string" ||
      !content.trim()
    ) {
      return Response.json({ error: "Invalid role or content" }, { status: 400 });
    }
    messages.push({ role, content: content.trim() });
  }

  try {
    const message = await generateChatReply(messages);
    return Response.json({ message });
  } catch (err) {
    console.error(err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Chat failed" },
      { status: 500 }
    );
  }
}