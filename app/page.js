"use client";
import { useState } from "react";
import Link from "next/link";
import Confetti from "./Confetti";

async function post(url, body) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

export default function Home() {
  const [step, setStep] = useState("name"); // name | pick | details | done
  const [name, setName] = useState("");
  const [matches, setMatches] = useState([]);
  const [row, setRow] = useState(null);
  const [studentId, setStudentId] = useState("");
  const [group, setGroup] = useState("");
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setBusy(true); setError("");
    try { await fn(); } catch (e) { setError(e.message); }
    setBusy(false);
  };

  const lookup = (e) => { e.preventDefault(); run(async () => {
    const { matches } = await post("/api/lookup", { name });
    const open = matches.filter((m) => !m.registered);
    if (!open.length) throw new Error("Chale you're already registered. Contact your course rep if this is a mistake.");
    setMatches(open);
    if (open.length === 1) { setRow(open[0].row); setStep("details"); } else setStep("pick");
  }); };

  const submit = (e) => { e.preventDefault(); run(async () => {
    const { link } = await post("/api/submit", { name, row, studentId, group });
    setLink(link); setStep("done");
    setTimeout(() => { window.location.href = link; }, 3500);
  }); };

  return (
    <main>
      <h1>Join your class group(BIT 1)</h1>
      <p className="sub">Enter your details and we'll redirect you to your WhatsApp group.</p>

      {step === "name" && (
        <form onSubmit={lookup}>
          <label>Full name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="First and last name" autoComplete="name" required />
          </label>
          {error && <p className="err" role="alert">{error}</p>}
          <button disabled={busy}>{busy ? "Checking…" : "Find my name"}</button>
        </form>
      )}

      {step === "pick" && (
        <form onSubmit={(e) => e.preventDefault()}>
          <strong>Which one is you?</strong>
          <div className="pick">
            {matches.map((m) => (
              <button type="button" className="ghost" key={m.row} onClick={() => { setRow(m.row); setStep("details"); }}>{m.name}</button>
            ))}
          </div>
          <button type="button" className="ghost" onClick={() => setStep("name")}>Back</button>
        </form>
      )}

      {step === "details" && (
        <form onSubmit={submit}>
          <label>Student ID
            <input value={studentId} onChange={(e) => setStudentId(e.target.value)} inputMode="text" autoComplete="off" required />
          </label>
          <label>Group number
            <input type="number" min="1" max="43" step="1" value={group} onChange={(e) => setGroup(e.target.value)} inputMode="numeric" autoComplete="off" placeholder="1 to 48" required />
          </label>
          {error && <p className="err" role="alert">{error}</p>}
          <button disabled={busy}>{busy ? "Saving…" : "Join my group"}</button>
        </form>
      )}

      {step === "done" && (
        <div className="done">
          <Confetti />
          <strong>You're registered. Opening WhatsApp…</strong>
          <a href={link}>Open my group</a>
        </div>
      )}

      <nav className="links">
        <Link href="/walk-in">My name isn't on the list</Link>
        <Link href="/edit">Fix a mistake (wrong ID or group)</Link>
      </nav>
    </main>
  );
}
