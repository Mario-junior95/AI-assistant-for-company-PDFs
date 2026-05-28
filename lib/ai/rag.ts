import { getVectorStore } from "@/lib/ai/vector-store";

const RETRIEVAL_K = 4;
const MIN_RELEVANCE_SCORE = Number(process.env.RAG_MIN_RELEVANCE_SCORE ?? "0.15");

export async function retrieveContext(query: string): Promise<string> {
  const store = await getVectorStore();
  if (!store) {
    return "";
  }

  const docsWithScores = await store.similaritySearchWithScore(query, RETRIEVAL_K);
  if (docsWithScores.length === 0) {
    return "";
  }

  const relevantDocs = docsWithScores.filter(([, score]) => score >= MIN_RELEVANCE_SCORE);
  if (relevantDocs.length === 0) {
    return "";
  }

  return relevantDocs
    .map(([doc, score], i) => {
      const source = doc.metadata?.source ?? "unknown";
      const chunkIndex =
        typeof doc.metadata?.chunkIndex === "number" ? ` chunk ${doc.metadata.chunkIndex}` : "";
      return `[${i + 1}] (${source}${chunkIndex}, score=${score.toFixed(3)})\n${doc.pageContent}`;
    })
    .join("\n\n");
}
