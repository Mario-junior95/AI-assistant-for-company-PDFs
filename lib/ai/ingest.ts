import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { createHash } from "crypto";

import { extractTextFromPdf } from "@/lib/ai/pdf";
import { upsertDocumentsInVectorStore } from "@/lib/ai/vector-store";

const PDF_MIME = "application/pdf";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

export type IngestedDocument = {
  id: string;
  name: string;
  chunks: number;
  fileHash: string;
};

function isPdf(file: File) {
  return (
    file.type === PDF_MIME || file.name.toLowerCase().endsWith(".pdf")
  );
}

export async function ingestPdfFile(file: File): Promise<IngestedDocument> {
  if (!isPdf(file)) {
    throw new Error("Only PDF files are allowed");
  }

  const documentId = crypto.randomUUID();
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileHash = createHash("sha256").update(buffer).digest("hex");
  const text = await extractTextFromPdf(buffer);
  const uploadedAt = new Date().toISOString();

  const baseDoc = new Document({
    pageContent: text,
    metadata: {
      documentId,
      source: file.name,
      fileHash,
      uploadedAt,
    },
  });

  const chunks = await splitter.splitDocuments([baseDoc]);
  const chunksWithIndex = chunks.map((chunk, index) => {
    chunk.metadata = {
      ...chunk.metadata,
      documentId,
      source: file.name,
      fileHash,
      uploadedAt,
      chunkIndex: index,
      chunkId: `${documentId}:${index}`,
    };
    return chunk;
  });

  await upsertDocumentsInVectorStore(chunksWithIndex, fileHash);

  return {
    id: documentId,
    name: file.name,
    chunks: chunksWithIndex.length,
    fileHash,
  };
}
