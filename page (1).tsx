import { notFound } from "next/navigation";
import Shell from "@/components/Shell";
import { WeightChart, SleepChart, WellbeingChart, TrendPoint } from "@/components/Charts";
import { requireUser } from "@/lib/auth";
import {
  findUserById, listCheckIns, listResponses, listNotes,
  listQuestionnaires, listDocuments, listPendingAssignments
} from "@/lib/db";
import { parseSchema } from "@/lib/questionnaire";
import { addNoteAction, assignQuestionnaireAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function ClientDetail({ params }: { params: { id: string } }) {
  const coach = await requireUser("COACH");
  const client = findUserById(params.id);
  if (!client || client.role !== "CLIENT") notFound();

  const checkIns = listCheckIns(client.id, 120);
  const responses = listResponses(client.id, 6);
  const notes = listNotes(client.id, 20);
  const questionnaires = listQuestionnaires();
  const docs = listDocuments(client.id);
  const openAssignments = listPendingAssignments(client.id);

  const trend: TrendPoint[] = checkIns.map((c) => ({
    date: c.date, weightKg: c.weightKg, sleepHours: c.sleepHours,
    energy: c.energy, mood: c.mood, stress: c.stress
  }));

  const recentNotesFromClient = [...checkIns].reverse().filter((c) => c.note).slice(0, 5);

  return (
    <Shell user={coach} active="coach">
      <h1>{client.name}</h1>
      <p className="muted">{client.email} · joined {client.createdAt.slice(0, 10)}</p>

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

      <div className="grid2">
        <div className="card">
          <h2>Questionnaire results</h2>
          {openAssignments.length > 0 && (
            <p className="small">Pending: {openAssignments.map((a) => a.qTitle).join(", ")}</p>
          )}
          {responses.length === 0 ? (
            <p className="muted">No responses yet.</p>
          ) : (
            responses.map((r) => {
              const schema = parseSchema(r.qSchema);
              const answers = JSON.parse(r.answers) as Record<string, string>;
              return (
                <details key={r.id} style={{ marginBottom: "0.8rem" }}>
                  <summary style={{ cursor: "pointer" }}>
                    <strong>{r.qTitle}</strong>{" "}
                    <span className="muted small">{r.createdAt.slice(0, 10)}</span>{" "}
                    {r.band && <span className="pill green">{r.band}</span>}{" "}
                    {r.score != null && <span className="muted small">score {r.score}</span>}
                  </summary>
                  <div style={{ padding: "0.6rem 0 0 1rem" }}>
                    {schema.questions.map((q) => {
                      const raw = answers[q.id];
                      let shown = raw;
                      if (q.type === "choice") {
                        shown = q.options.find((o) => String(o.value) === raw)?.label ?? raw;
                      }
                      return (
                        <p className="small" key={q.id}>
                          <span className="muted">{q.text}</span>
                          <br />
                          <strong>{shown || "—"}</strong>
                        </p>
                      );
                    })}
                  </div>
                </details>
              );
            })
          )}

          <form action={assignQuestionnaireAction} style={{ marginTop: "1rem" }}>
            <input type="hidden" name="clientId" value={client.id} />
            <label htmlFor="questionnaireId">Assign a questionnaire</label>
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <select id="questionnaireId" name="questionnaireId">
                {questionnaires.map((q) => (
                  <option key={q.id} value={q.id}>{q.title}</option>
                ))}
              </select>
              <button className="btn small" style={{ marginTop: 0 }}>Assign</button>
            </div>
          </form>
        </div>

        <div className="card">
          <h2>Coach notes</h2>
          <form action={addNoteAction}>
            <input type="hidden" name="clientId" value={client.id} />
            <textarea name="body" placeholder="Session notes, plan adjustments, observations…" required />
            <button className="btn small" style={{ marginTop: "0.6rem" }}>Save note</button>
          </form>
          <div style={{ marginTop: "1rem" }}>
            {notes.map((n) => (
              <p className="small" key={n.id} style={{ borderBottom: "1px dashed var(--line)", paddingBottom: "0.5rem" }}>
                <span className="muted">{n.createdAt.slice(0, 16).replace("T", " ")}</span>
                <br />
                {n.body}
              </p>
            ))}
            {notes.length === 0 && <p className="muted">No notes yet.</p>}
          </div>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <h2>Client documents</h2>
          {docs.length === 0 ? (
            <p className="muted">Nothing uploaded yet.</p>
          ) : (
            <table>
              <thead><tr><th>File</th><th>Category</th><th>Date</th></tr></thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id}>
                    <td><a href={`/api/documents/${d.id}`} target="_blank">{d.filename}</a></td>
                    <td><span className="pill amber">{d.category}</span></td>
                    <td className="muted">{d.uploadedAt.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h2>Recent notes from the client</h2>
          {recentNotesFromClient.length === 0 ? (
            <p className="muted">No check-in notes yet.</p>
          ) : (
            recentNotesFromClient.map((c) => (
              <p className="small" key={c.id}>
                <span className="muted">{c.date}:</span> {c.note}
              </p>
            ))
          )}
        </div>
      </div>
    </Shell>
  );
}
