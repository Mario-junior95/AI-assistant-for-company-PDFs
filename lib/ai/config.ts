export const QDRANT_COLLECTION =
  process.env.QDRANT_COLLECTION ?? "company_pdfs";

export function getQdrantConfig() {
  const url = process.env.QDRANT_URL;
  if (!url) {
    throw new Error("QDRANT_URL is not configured");
  }

  return {
    url,
    apiKey: process.env.QDRANT_API_KEY,
    collectionName: QDRANT_COLLECTION,
  };
}
