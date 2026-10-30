export async function extractText(name: string, buf: Buffer): Promise<string> {
  if (name.toLowerCase().endsWith(".pdf")) {
    // Import the inner file: pdf-parse's index.js runs a debug routine when it has no parent module.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdf = require("pdf-parse/lib/pdf-parse.js");
    return (await pdf(buf)).text as string;
  }
  return buf.toString("utf8");
}
