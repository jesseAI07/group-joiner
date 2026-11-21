import { NextResponse } from "next/server";
import { getRows, nameMatches } from "@/lib/sheets";

export async function POST(req) {
  try {
    const { name } = await req.json();
    const rows = await getRows("Students!A2:B");
    const matches = rows
      .map((r, i) => ({ row: i + 2, name: r[0] || "", registered: !!(r[1] || "").trim() }))
      .filter((r) => nameMatches(name, r.name))
      .slice(0, 5);
    if (!matches.length)
      return NextResponse.json({ error: "We couldn't find that name. Type your first and last name as on your course list." }, { status: 404 });
    return NextResponse.json({ matches });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}
