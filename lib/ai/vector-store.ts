import { QdrantClient } from "@qdrant/js-client-rest";
import { QdrantVectorStore } from "@langchain/qdrant";
import type { Document } from "@langchain/core/documents";

import { getQdrantConfig } from "@/lib/ai/config";
import { getEmbeddings } from "@/lib/ai/embeddings";

async function collectionExists(collectionName: string, url: string, apiKey?: string) {
  const client = new QdrantClient({ url, apiKey });
  const { collections } = await client.getCollections();
  return collections.some((c) => c.name === collectionName);
}

export async function addDocumentsToVectorStore(documents: Document[]) {
  if (documents.length === 0) {
    throw new Error("No document chunks to store");
  }

  const embeddings = getEmbeddings();
  const config = getQdrantConfig();
  const exists = await collectionExists(
    config.collectionName,
    config.url,
    config.apiKey
  );

  if (exists) {
    const store = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      config
    );
    await store.addDocuments(documents);
    return store;
  }

  return QdrantVectorStore.fromDocuments(documents, embeddings, config);
}

export async function getVectorStore() {
  const embeddings = getEmbeddings();
  const config = getQdrantConfig();
  const exists = await collectionExists(
    config.collectionName,
    config.url,
    config.apiKey
  );

  if (!exists) {
    return null;
  }

  return QdrantVectorStore.fromExistingCollection(embeddings, config);
}
