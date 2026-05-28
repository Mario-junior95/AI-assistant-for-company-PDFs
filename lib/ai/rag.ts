import { getVectorStore } from "@/lib/ai/vector-store";

const RETRIEVAL_K = 4;

export async function retrieveContext(query: string): Promise<string> {
  const store = await getVectorStore();
  if (!store) {
    return "";
  }

  const docs = await store.similaritySearch(query, RETRIEVAL_K);
  if (docs.length === 0) {
    return "";
  }

  return docs
    .map((doc, i) => {
      const source = doc.metadata?.source ?? "unknown";
      return `[${i + 1}] (${source})\n${doc.pageContent}`;
    })
    .join("\n\n");
}
