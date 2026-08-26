import Link from "next/link";
import Shell from "@/components/Shell";
import { WeightChart, SleepChart, WellbeingChart, TrendPoint } from "@/components/Charts";
import { requireUser, todayStr } from "@/lib/auth";
import { listCheckIns, listPendingAssignments, listResponses } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Dashboard({ searchParams }: { searchParams: { saved?: string } }) {
  const user = await requireUser("CLIENT");

  const checkIns = listCheckIns(user.id, 90);
  const pending = listPendingAssignments(user.id);
  const lastResponse = listResponses(user.id, 1)[0];

  const today = todayStr();
  const todayDone = checkIns.some((c) => c.date === today);
  const latest = checkIns[checkIns.length - 1];
  const first = checkIns.find((c) => c.weightKg != null);
  const latestWeight = [...checkIns].reverse().find((c) => c.weightKg != null);
  const weightDelta =
    first?.weightKg != null && latestWeight?.weightKg != null
      ? Math.round((latestWeight.weightKg - first.weightKg) * 10) / 10
      : null;

  // Streak: consecutive daily check-ins ending today or yesterday.
  let streak = 0;
  const dates = new Set(checkIns.map((c) => c.date));
  const cursor = new Date();
  if (!dates.has(today)) cursor.setDate(cursor.getDate() - 1);
  for (;;) {
    const s = new Date(cursor.getTime() - cursor.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    if (dates.has(s)) { streak++; cursor.setDate(cursor.getDate() - 1); } else break;
  }

  const trend: TrendPoint[] = checkIns.map((c) => ({
    date: c.date, weightKg: c.weightKg, sleepHours: c.sleepHours,
    energy: c.energy, mood: c.mood, stress: c.stress
  }));

  return (
    <Shell user={user} active="dashboard">
      <h1>Hello, {user.name.split(" ")[0]}</h1>
      <p className="muted">Small daily steps, tracked over time.</p>

      {searchParams.saved && <div className="alert ok">Check-in saved. Well done.</div>}

      {!todayDone && (
        <div className="card" style={{ background: "var(--leaf-tint)", border: "none" }}>
          <h3>Today&apos;s check-in is open</h3>
          <p className="muted">It takes about 30 seconds.</p>
          <Link className="btn" href="/checkin">Do today&apos;s check-in</Link>
        </div>
      )}

      {pending.length > 0 && (
        <div className="card" style={{ background: "var(--beet-tint)", border: "none" }}>
          <h3>Questionnaires from your coach</h3>
          {pending.map((a) => (
            <p key={a.id}>
              <Link href={`/questionnaires/${a.qSlug}`}>{a.qTitle}</Link>{" "}
              <span className="muted small">— assigned {a.createdAt.slice(0, 10)}</span>
            </p>
          ))}
        </div>
      )}

      <div className="grid3">
        <div className="card stat">
          <div className="value">{streak}</div>
          <div className="label">day streak</div>
        </div>
        <div className="card stat">
          <div className="value">{latestWeight?.weightKg != null ? `${latestWeight.weightKg} kg` : "—"}</div>
          <div className="label">latest weight</div>
        </div>
        <div className="card stat">
          <div className="value">{weightDelta == null ? "—" : `${weightDelta > 0 ? "+" : ""}${weightDelta} kg`}</div>
          <div className="label">change since start</div>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <h2>Weight</h2>
          <WeightChart data={trend} />
        </div>
        <div className="card">
          <h2>Sleep</h2>
          <SleepChart data={trend} />
        </div>
      </div>

      <div className="card">
        <h2>Energy · Mood · Stress</h2>
        <WellbeingChart data={trend} />
      </div>

      {lastResponse && (
        <div className="card">
          <h2>Latest questionnaire result</h2>
          <p>
            <strong>{lastResponse.qTitle}</strong>{" "}
            {lastResponse.band && <span className="pill green">{lastResponse.band}</span>}{" "}
            {lastResponse.score != null && <span className="muted">score {lastResponse.score}</span>}
          </p>
        </div>
      )}

      {latest?.note && <p className="muted small">Your last note ({latest.date}): “{latest.note}”</p>}
    </Shell>
  );
}
