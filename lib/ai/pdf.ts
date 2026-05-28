import { PDFParse } from "pdf-parse";

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({
    data: new Uint8Array(buffer),
  });

  try {
    const result = await parser.getText();
    const text = result.text?.trim() ?? "";

    if (!text) {
      throw new Error("No text could be extracted from the PDF");
    }

    return text;
  } finally {
    await parser.destroy();
  }
}
