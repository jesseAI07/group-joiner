"use client";
import { useState } from "react";
import Link from "next/link";
import Confetti from "../Confetti";

async function post(body) {
  const res = await fetch("/api/edit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

export default function Edit() {
  const [step, setStep] = useState("verify"); // verify | change | done
  const [name, setName] = useState("");
  const [currentId, setCurrentId] = useState("");
  const [info, setInfo] = useState(null);
  const [newId, setNewId] = useState("");
  const [newGroup, setNewGroup] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setBusy(true);
    setError("");
    try { await fn(); } catch (e) { setError(e.message); }
    setBusy(false);
  };

  const verify = (e) => { e.preventDefault(); run(async () => {
    const data = await post({ action: "verify", name, currentId });
    setInfo(data);
    setNewGroup(data.group);
    setStep("change");
  }); };

  const update = (e) => { e.preventDefault(); run(async () => {
    const data = await post({ action: "update", name, currentId, newId, newGroup });
    setResult(data);
    setStep("done");
    if (data.link) setTimeout(() => { window.location.href = data.link; }, 3000);
  }); };

  return (
    <main>
      <h1>Fix a mistake</h1>
      <p className="sub">Wrong student ID or wrong group? Confirm who you are first.</p>

      {step === "verify" && (
        <form onSubmit={verify}>
          <label>Your name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="First and last name" required />
          </label>
          <label>Student ID you registered with
            <input value={currentId} onChange={(e) => setCurrentId(e.target.value)} autoComplete="off" required />
          </label>
          {error && <p className="err" role="alert">{error}</p>}
          <button disabled={busy}>{busy ? "Checking…" : "Continue"}</button>
        </form>
      )}

      {step === "change" && info && (
        <form onSubmit={update}>
          <p className="note">Registered as <strong>{info.name}</strong>, currently in Group {info.group}.</p>
          <label>New student ID (leave blank to keep it)
            <input value={newId} onChange={(e) => setNewId(e.target.value)} autoComplete="off" />
          </label>
          <label>Group
            <select value={newGroup} onChange={(e) => setNewGroup(e.target.value)}>
              {info.groups.map((g) => <option key={g} value={g}>Group {g}</option>)}
            </select>
          </label>
          {error && <p className="err" role="alert">{error}</p>}
          <button disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
        </form>
      )}

      {step === "done" && result && (
        <div className="done">
          <Confetti />
          <strong>
            {result.idChanged && "Student ID updated. "}
            {result.groupChanged && `You're now in Group ${result.group}. Opening WhatsApp…`}
          </strong>
          {result.groupChanged && (
            <>
              <a href={result.link}>Open my new group</a>
              <p className="note">Remember to leave your old WhatsApp group yourself. The app can't remove you.</p>
            </>
          )}
        </div>
      )}

      <nav className="links"><Link href="/">Back to the main form</Link></nav>
    </main>
  );
}