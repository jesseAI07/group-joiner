import { google } from "googleapis";

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export const sheets = google.sheets({ version: "v4", auth });
export const SHEET_ID = process.env.SHEET_ID;

const tokens = (s) =>
  (s || "").toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean);

// Order-insensitive: every word the student typed must appear in the listed name.
// Needs at least 2 words so a single common name can't match everyone.
export function nameMatches(typed, actual) {
  const t = tokens(typed);
  const a = tokens(actual);
  return t.length >= 2 && t.every((w) => a.includes(w));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Retries when Google says "too many requests" (429) or has a server hiccup (5xx).
// Waits roughly 0.4s, 0.8s, 1.6s, 3.2s between tries.
export async function withRetry(fn, tries = 5) {
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      const status = Number(e?.code || e?.response?.status);
      const retryable = status === 429 || status >= 500;
      if (!retryable || i === tries - 1) throw e;
      await sleep(400 * 2 ** i + Math.random() * 300);
    }
  }
}

export async function getRows(range) {
  const res = await withRetry(() =>
    sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range })
  );
  return res.data.values || [];
}

export const ID_REGEX = () => new RegExp(process.env.ID_PATTERN || "^[A-Za-z0-9]{5,15}$");

// Returns a Map of group number (as a string) -> WhatsApp link, skipping groups with no link.
export async function getGroupLinks() {
  const rows = await getRows("Groups!A2:B");
  const links = new Map();
  for (const [g, link] of rows) {
    const n = String(g ?? "").trim();
    const url = String(link ?? "").trim();
    if (/^\d+$/.test(n) && url) links.set(n.replace(/^0+(?=\d)/, ""), url);
  }
  return links;
}