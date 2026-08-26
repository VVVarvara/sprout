import Shell from "@/components/Shell";
import { requireUser, todayStr } from "@/lib/auth";
import { getCheckIn } from "@/lib/db";
import { checkInAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

function Berries({ name, value, green }: { name: string; value: number | null; green?: boolean }) {
  return (
    <div className={`berries ${green ? "green" : ""}`} role="radiogroup" aria-label={name}>
      {[1, 2, 3, 4, 5].map((n) => (
        <label key={n} style={{ margin: 0 }}>
          <input type="radio" name={name} value={n} defaultChecked={value === n} />
          <span className="berry"><span>{n}</span></span>
        </label>
      ))}
    </div>
  );
}

export default async function CheckInPage() {
  const user = await requireUser("CLIENT");
  const today = todayStr();
  const existing = getCheckIn(user.id, today);

  return (
    <Shell user={user} active="checkin">
      <h1>Daily check-in</h1>
      <p className="muted">{today}{existing ? " — already saved today; you can update it." : ""}</p>

      <div className="card" style={{ maxWidth: 620 }}>
        <form action={checkInAction}>
          <input type="hidden" name="date" value={today} />

          <div className="grid2">
            <div>
              <label htmlFor="weightKg">Weight (kg)</label>
              <input id="weightKg" name="weightKg" type="number" step="0.1" min="20" max="400"
                defaultValue={existing?.weightKg ?? ""} placeholder="e.g. 78.4" />
            </div>
            <div>
              <label htmlFor="sleepHours">Sleep last night (hours)</label>
              <input id="sleepHours" name="sleepHours" type="number" step="0.5" min="0" max="16"
                defaultValue={existing?.sleepHours ?? ""} placeholder="e.g. 7.5" />
            </div>
          </div>

          <label>Energy today</label>
          <Berries name="energy" value={existing?.energy ?? null} green />

          <label>Mood today</label>
          <Berries name="mood" value={existing?.mood ?? null} green />

          <label>Stress today (1 = calm, 5 = very stressed)</label>
          <Berries name="stress" value={existing?.stress ?? null} />

          <label htmlFor="waterL">Water (litres)</label>
          <input id="waterL" name="waterL" type="number" step="0.1" min="0" max="10"
            defaultValue={existing?.waterL ?? ""} placeholder="e.g. 1.8" style={{ maxWidth: 160 }} />

          <label htmlFor="note">Anything worth noting? (optional)</label>
          <textarea id="note" name="note" defaultValue={existing?.note ?? ""}
            placeholder="Meals, cravings, symptoms, wins…" />

          <button className="btn">{existing ? "Update check-in" : "Save check-in"}</button>
        </form>
      </div>
    </Shell>
  );
}
