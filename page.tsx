import Link from "next/link";
import Shell from "@/components/Shell";
import { requireUser, todayStr } from "@/lib/auth";
import { clientOverview } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CoachPage() {
  const coach = await requireUser("COACH");
  const clients = clientOverview();
  const today = todayStr();

  return (
    <Shell user={coach} active="coach">
      <h1>Your clients</h1>
      <p className="muted">
        {clients.length} client{clients.length === 1 ? "" : "s"} · clients create their own accounts at{" "}
        <code>/register</code>
      </p>

      <div className="card">
        {clients.length === 0 ? (
          <p className="muted">No clients yet. Share the register link to get started.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Last check-in</th>
                <th>Open questionnaires</th>
                <th>Latest document</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => {
                const stale =
                  !c.lastCheckIn ||
                  (new Date(today).getTime() - new Date(c.lastCheckIn).getTime()) / 86400000 >= 3;
                return (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.name}</strong>
                      <br />
                      <span className="muted small">{c.email}</span>
                    </td>
                    <td>
                      {c.lastCheckIn ? (
                        <>
                          {c.lastCheckIn}{" "}
                          {stale ? <span className="pill amber">quiet</span> : <span className="pill green">active</span>}
                        </>
                      ) : (
                        <span className="pill amber">never</span>
                      )}
                    </td>
                    <td>
                      {c.pendingCount > 0
                        ? <span className="pill beet">{c.pendingCount} pending</span>
                        : <span className="muted">—</span>}
                    </td>
                    <td className="muted">{c.lastDocument ? c.lastDocument.slice(0, 10) : "—"}</td>
                    <td><Link className="btn secondary small" href={`/coach/clients/${c.id}`}>Open</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </Shell>
  );
}
