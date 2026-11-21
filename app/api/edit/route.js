import { NextResponse } from "next/server";
import { getRows, getGroupLinks, nameMatches, sheets, SHEET_ID, withRetry, ID_REGEX } from "@/lib/sheets";

const fail = (error, status = 400) => NextResponse.json({ error }, { status });
const clean = (s) => String(s || "").trim().replace(/\s+/g, " ");
const same = (a, b) => String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();

export async function POST(req) {
  try {
    const { action, name, currentId, newId, newGroup } = await req.json();
    const cur = clean(currentId);
    if (!clean(name) || !cur) return fail("Enter your name and your current student ID.");

    const students = await getRows("Students!A2:D");
    const i = students.findIndex((r) => same(r[1], cur) && nameMatches(name, r[0]));
    if (i === -1)
      return fail(
        "We couldn't match that name and ID. Use them exactly as you registered. If you can't remember, contact your course rep.",
        404
      );

    const row = i + 2;
    const rec = students[i];
    const oldGroup = String(rec[2] || "").trim();
    const links = await getGroupLinks();

    if (action === "verify") {
      return NextResponse.json({
        name: rec[0],
        group: oldGroup,
        groups: [...links.keys()].sort((a, b) => a - b),
      });
    }

    const idChange = clean(newId);
    const grpChange = clean(newGroup).replace(/^0+(?=\d)/, "");
    let finalId = String(rec[1]).trim();
    let finalGroup = oldGroup;
    let idChanged = false;
    let groupChanged = false;

    if (idChange && !same(idChange, cur)) {
      if (!ID_REGEX().test(idChange)) return fail("That new student ID doesn't look right.");
      if (students.some((r, k) => k !== i && same(r[1], idChange)))
        return fail("That student ID is already registered to someone else.", 409);
      finalId = idChange;
      idChanged = true;
    }
    if (grpChange && grpChange !== oldGroup) {
      if (!links.has(grpChange)) return fail(`Group ${grpChange} doesn't exist.`);
      finalGroup = grpChange;
      groupChanged = true;
    }
    if (!idChanged && !groupChanged) return fail("Nothing to change.");

    await withRetry(() =>
      sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
          valueInputOption: "RAW",
          data: [
            { range: `Students!B${row}:C${row}`, values: [[finalId, finalGroup]] },
            { range: `Students!F${row}`, values: [[new Date().toISOString()]] },
          ],
        },
      })
    );

    return NextResponse.json({
      idChanged,
      groupChanged,
      group: finalGroup,
      link: groupChanged ? links.get(finalGroup) : null,
    });
  } catch (e) {
    console.error(e);
    return fail("Something went wrong. Try again.", 500);
  }
}