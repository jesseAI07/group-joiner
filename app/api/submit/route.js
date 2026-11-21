import { NextResponse } from "next/server";
import { getRows, nameMatches, sheets, SHEET_ID, withRetry } from "@/lib/sheets";

const fail = (error, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req) {
  try {
    const { name, row, studentId, group } = await req.json();
    const id = String(studentId || "").trim();
    const grp = String(group || "").trim().replace(/^0+(?=\d)/, "");
    const pattern = new RegExp(process.env.ID_PATTERN || "^[A-Za-z0-9]{5,15}$");

    if (!Number.isInteger(row) || row < 2) return fail("Invalid request.");
    if (!pattern.test(id)) return fail("That student ID doesn't look right. Check it and try again.");
    if (!/^\d+$/.test(grp) || +grp < 1 || +grp > 48) return fail("Group number must be between 1 and 48.");

    // Re-check the row server-side so nobody can write to someone else's row.
    const students = await getRows("Students!A2:B");
    const current = students[row - 2];
    if (!current || !nameMatches(name, current[0])) return fail("Name doesn't match this record.");
    if ((current[1] || "").trim()) return fail("This student is already registered. Contact your course rep if this is a mistake.", 409);
    if (students.some((r) => (r[1] || "").trim().toLowerCase() === id.toLowerCase()))
      return fail("This student ID has already been used.", 409);

    const groups = await getRows("Groups!A2:B");
    const found = groups.find((g) => String(g[0] || "").trim() === grp);
    if (!found || !found[1]) return fail(`Group ${grp} doesn't exist. Check your group number.`);

    await withRetry(() =>
      sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `Students!B${row}:D${row}`,
        valueInputOption: "RAW",
        requestBody: { values: [[id, grp, new Date().toISOString()]] },
      })
    );

    return NextResponse.json({ link: found[1].trim() });
  } catch (e) {
    console.error(e);
    return fail("Something went wrong. Try again.", 500);
  }
}
