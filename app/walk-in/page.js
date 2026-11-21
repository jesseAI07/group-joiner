"use client";
import { useState } from "react";
import Link from "next/link";
import GroupReveal from "../GroupReveal";

export default function WalkIn() {
  const [f, setF] = useState({ surname: "", otherNames: "", studentId: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/walkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setResult(data);
      //setTimeout(() => { window.location.href = data.link; }, 2500);
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  return (
    <main>
      <h1>Not on the list?</h1>
      <p className="sub">Add yourself and we'll assign you to a group.</p>

      {result ? (
        <div className="done">
          <GroupReveal
            group={result.group}
            onDone={() => {
              setRevealed(true);
              setTimeout(() => { window.location.href = result.link; }, 6000);
            }}
          />
          {revealed && <a href={result.link}>Open my group</a>}
        </div>
      ) : (
        <form onSubmit={submit}>
          <label>Surname
            <input value={f.surname} onChange={set("surname")} autoComplete="family-name" required />
          </label>
          <label>Other names
            <input value={f.otherNames} onChange={set("otherNames")} autoComplete="given-name" required />
          </label>
          <label>Student ID
            <input value={f.studentId} onChange={set("studentId")} autoComplete="off" required />
          </label>
          {error && <p className="err" role="alert">{error}</p>}
          <button disabled={busy}>{busy ? "Saving…" : "Add me and assign my group"}</button>
        </form>
      )}

      <nav className="links"><Link href="/">Back to the main form</Link></nav>
    </main>
  );
}