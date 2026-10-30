// Optional: append each captured lead to a Google Sheet (share the sheet with the service-account email).
// Uses google-auth-library + the Sheets REST API directly (the full googleapis SDK is ~190 MB and bloats serverless bundles).
import { GoogleAuth } from "google-auth-library";

export async function appendLeadToSheet(row: string[]) {
  const { GOOGLE_SERVICE_ACCOUNT_JSON: json, SHEET_ID: id } = process.env;
  if (!json || !id) return;
  try {
    const auth = new GoogleAuth({ credentials: JSON.parse(json), scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
    const client = await auth.getClient();
    await client.request({
      url: `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values/A1:append?valueInputOption=USER_ENTERED`,
      method: "POST",
      data: { values: [row] },
    });
  } catch (e) { console.warn("sheet append failed:", (e as Error).message); }
}
