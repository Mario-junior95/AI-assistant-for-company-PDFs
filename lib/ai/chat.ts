import { ChatOpenAI } from "@langchain/openai";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";

import { retrieveContext } from "@/lib/ai/rag";
import type { ChatMessage } from "./types";

const BASE_SYSTEM_PROMPT =
  "You are a helpful assistant for company PDF documents. Answer using only the provided context when available. If the context does not contain the answer, say so clearly. Be concise, accurate, and never guess. Every factual claim must include citation markers like [1] or [2] that map to the provided context sections.";

function toLangChainMessage(m: ChatMessage) {
  if (m.role === "system") return new SystemMessage(m.content);
  if (m.role === "assistant") return new AIMessage(m.content);
  return new HumanMessage(m.content);
}

async function buildSystemPrompt(messages: ChatMessage[]) {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) {
    return BASE_SYSTEM_PROMPT;
  }

  const context = await retrieveContext(lastUser.content);
  if (!context) {
    return `${BASE_SYSTEM_PROMPT}\n\nNo relevant document context is available yet. Ask the user to upload company PDFs on the Upload page or rephrase the question.`;
  }

  return `${BASE_SYSTEM_PROMPT}\n\nContext from uploaded company PDFs:\n\n${context}\n\nIf the answer is not fully supported by the context, respond: "I could not find that in the uploaded PDFs."`;
}

export async function generateChatReply(messages: ChatMessage[]) {
  const model = new ChatOpenAI({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.2,
    streaming: true,
  });

  const systemPrompt = await buildSystemPrompt(messages);

  const response = await model.invoke([
    new SystemMessage(systemPrompt),
    ...messages.map(toLangChainMessage),
  ]);

  const text =
    typeof response.content === "string"
      ? response.content
      : String(response.content);

  return text;
}
