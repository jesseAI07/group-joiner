import { NextResponse } from "next/server";
import { getRows, getGroupLinks, nameMatches, sheets, SHEET_ID, withRetry, ID_REGEX } from "@/lib/sheets";

const fail = (error, status = 400) => NextResponse.json({ error }, { status });
const clean = (s) => String(s || "").trim().replace(/\s+/g, " ");
const NAME_OK = /^[\p{L}][\p{L}'’.\- ]{0,59}$/u;

export async function POST(req) {
  try {
    const body = await req.json();
    const surname = clean(body.surname);
    const others = clean(body.otherNames);
    const id = clean(body.studentId);

    if (!NAME_OK.test(surname) || !NAME_OK.test(others))
      return fail("Enter your surname and other names using letters only.");
    if (!ID_REGEX().test(id))
      return fail("That student ID doesn't look right. Check it and try again.");

    const students = await getRows("Students!A2:E");

    // Already on the list? Send them to the normal form.
    if (students.some((r) => nameMatches(`${others} ${surname}`, r[0])))
      return fail("Your name is already on the list. Go back and use the main form.", 409);

    if (students.some((r) => String(r[1] || "").trim().toLowerCase() === id.toLowerCase()))
      return fail("This student ID is already registered. If it's yours, use 'Fix a mistake'.", 409);

    const links = await getGroupLinks();
    if (!links.size) return fail("No groups are available right now. Contact your course rep.", 500);

    // Count current members per group, then pick randomly among the smallest groups.
    const counts = new Map([...links.keys()].map((g) => [g, 0]));
    for (const r of students) {
      const g = String(r[2] || "").trim();
      if (counts.has(g)) counts.set(g, counts.get(g) + 1);
    }
    const min = Math.min(...counts.values());
    const pool = [...counts].filter(([, c]) => c === min).map(([g]) => g);
    const group = pool[Math.floor(Math.random() * pool.length)];

    await withRetry(() =>
      sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: "Students!A:E",
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [[`${surname.toUpperCase()}, ${others}`, id, group, new Date().toISOString(), "walk-in"]],
        },
      })
    );

    return NextResponse.json({ group, link: links.get(group) });
  } catch (e) {
    console.error(e);
    return fail("Something went wrong. Try again.", 500);
  }
}