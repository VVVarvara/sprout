export type Question =
  | { id: string; text: string; type: "choice"; options: { label: string; value: number }[] }
  | { id: string; text: string; type: "scale"; min: number; max: number }
  | { id: string; text: string; type: "number"; unit?: string }
  | { id: string; text: string; type: "text" };

export type Band = { min: number; max: number; label: string; advice: string };

export type QSchema = { questions: Question[]; bands?: Band[] };

export function parseSchema(json: string): QSchema {
  return JSON.parse(json) as QSchema;
}

export function scoreAnswers(schema: QSchema, answers: Record<string, string>) {
  let score = 0;
  let scorable = false;
  for (const q of schema.questions) {
    const raw = answers[q.id];
    if (raw === undefined || raw === "") continue;
    if (q.type === "choice" || q.type === "scale") {
      const n = Number(raw);
      if (!Number.isNaN(n)) {
        score += n;
        scorable = true;
      }
    }
  }
  if (!scorable) return { score: null as number | null, band: null as string | null };
  const band = schema.bands?.find((b) => score >= b.min && score <= b.max)?.label ?? null;
  return { score, band };
}
