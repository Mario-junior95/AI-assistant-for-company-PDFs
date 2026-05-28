import { ingestPdfFile } from "@/lib/ai/ingest";

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  if (!process.env.QDRANT_URL) {
    return Response.json(
      { error: "QDRANT_URL is not configured" },
      { status: 500 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { error: "Expected multipart form data" },
      { status: 400 }
    );
  }

  const files = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File);

  if (files.length === 0) {
    return Response.json(
      { error: "At least one PDF file is required (field: files)" },
      { status: 400 }
    );
  }

  try {
    const documents = await Promise.all(files.map(ingestPdfFile));
    return Response.json({ documents }, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
