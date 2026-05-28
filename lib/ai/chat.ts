import { ChatOpenAI } from "@langchain/openai";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";

import { retrieveContext } from "@/lib/ai/rag";
import type { ChatMessage } from "./types";

const BASE_SYSTEM_PROMPT =
  `You are a helpful assistant for company PDF documents.
Answer using only the provided context.
Do not use outside knowledge.
If the context does not contain the answer, reply exactly:
"I could not find that in the uploaded PDFs."

Formatting requirements:
- Start with a direct answer sentence.
- If there are multiple items, use a numbered list.
- Format list items as: **<Entity>** - <Detail> (<Date range when available>)
- Keep output concise and well-structured.
- Every factual claim must include citations using the human-readable refs from context, e.g. [resume.pdf#chunk-2].
- End factual answers with: Sources: [resume.pdf#chunk-2], [policy.pdf#chunk-1].`;

function toLangChainMessage(m: ChatMessage) {
  if (m.role === "system") return new SystemMessage(m.content);
  if (m.role === "assistant") return new AIMessage(m.content);
  return new HumanMessage(m.content);
}

function extractContextRefs(context: string): string[] {
  const refs = new Set<string>();
  const lines = context.split("\n");
  for (const line of lines) {
    const match = line.match(/^\[([^\]]+)\]/);
    if (match?.[1]) {
      refs.add(match[1]);
    }
  }
  return [...refs];
}

function normalizeCitationMarkers(text: string, refs: string[]): string {
  return text.replace(/\[(\d+)\]/g, (full, rawIndex) => {
    const idx = Number(rawIndex);
    if (!Number.isInteger(idx) || idx < 1 || idx > refs.length) {
      return full;
    }
    return `[${refs[idx - 1]}]`;
  });
}

async function buildPromptContext(messages: ChatMessage[]) {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) {
    return {
      hasContext: false,
      context: "",
    };
  }

  const context = await retrieveContext(lastUser.content);
  return {
    hasContext: Boolean(context),
    context,
  };
}

export async function generateChatReply(messages: ChatMessage[]) {
  const { hasContext, context } = await buildPromptContext(messages);
  if (!hasContext) {
    return "I could not find that in the uploaded PDFs.";
  }
  const refs = extractContextRefs(context);

  const model = new ChatOpenAI({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.2,
    streaming: true,
  });

  const systemPrompt = `${BASE_SYSTEM_PROMPT}\n\nContext from uploaded company PDFs:\n\n${context}`;

  const response = await model.invoke([
    new SystemMessage(systemPrompt),
    ...messages.map(toLangChainMessage),
  ]);

  const text =
    typeof response.content === "string"
      ? response.content
      : String(response.content);

  return normalizeCitationMarkers(text, refs);
}
