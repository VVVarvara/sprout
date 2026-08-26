import Link from "next/link";
import Shell from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { listQuestionnaires, listResponses, listPendingAssignments } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function QuestionnairesPage({ searchParams }: { searchParams: { done?: string } }) {
  const user = await requireUser();

  const all = listQuestionnaires();
  const responses = listResponses(user.id, 100);
  const pending = user.role === "CLIENT" ? listPendingAssignments(user.id) : [];

  const lastBySlug = new Map<string, (typeof responses)[number]>();
  for (const r of responses) {
    if (!lastBySlug.has(r.qSlug)) lastBySlug.set(r.qSlug, r);
  }

  return (
    <Shell user={user} active="questionnaires">
      <h1>Questionnaires</h1>
      <p className="muted">
        {user.role === "COACH"
          ? "The instruments available in your practice. Assign them from a client's page."
          : "Complete anything assigned to you, or retake one to track change over time."}
      </p>

      {searchParams.done && <div className="alert ok">Response submitted — thank you.</div>}

      {pending.length > 0 && (
        <div className="card" style={{ background: "var(--beet-tint)", border: "none" }}>
          <h3>Assigned to you</h3>
          {pending.map((a) => (
            <p key={a.id}>
              <Link href={`/questionnaires/${a.qSlug}`}>{a.qTitle}</Link>
            </p>
          ))}
        </div>
      )}

      {all.map((q) => {
        const last = lastBySlug.get(q.slug);
        return (
          <div className="card" key={q.id}>
            <h2>{q.title}</h2>
            <p className="muted">{q.description}</p>
            {last && (
              <p className="small">
                Last completed {last.createdAt.slice(0, 10)}
                {last.band && <> — <span className="pill green">{last.band}</span></>}
                {last.score != null && <span className="muted"> (score {last.score})</span>}
              </p>
            )}
            {user.role === "CLIENT" && (
              <Link className="btn secondary small" href={`/questionnaires/${q.slug}`} style={{ marginTop: "0.6rem" }}>
                {last ? "Take again" : "Start"}
              </Link>
            )}
          </div>
        );
      })}
    </Shell>
  );
}
