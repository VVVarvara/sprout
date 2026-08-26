import { notFound } from "next/navigation";
import Shell from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { getQuestionnaireBySlug } from "@/lib/db";
import { parseSchema } from "@/lib/questionnaire";
import { submitQuestionnaireAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function TakeQuestionnaire({ params }: { params: { slug: string } }) {
  const user = await requireUser("CLIENT");
  const q = getQuestionnaireBySlug(params.slug);
  if (!q) notFound();

  const schema = parseSchema(q.schema);

  return (
    <Shell user={user} active="questionnaires">
      <h1>{q.title}</h1>
      <p className="muted">{q.description}</p>

      <div className="card" style={{ maxWidth: 680 }}>
        <form action={submitQuestionnaireAction}>
          <input type="hidden" name="slug" value={q.slug} />
          {schema.questions.map((question, i) => (
            <div className="qblock" key={question.id}>
              <p style={{ fontWeight: 600 }}>{i + 1}. {question.text}</p>

              {question.type === "choice" && (
                <div className="choices">
                  {question.options.map((o) => (
                    <label key={o.label}>
                      <input type="radio" name={`q_${question.id}`} value={o.value} required />
                      {o.label}
                    </label>
                  ))}
                </div>
              )}

              {question.type === "scale" && (
                <>
                  <input
                    type="range" name={`q_${question.id}`}
                    min={question.min} max={question.max}
                    defaultValue={Math.round((question.min + question.max) / 2)}
                    style={{ width: "100%" }}
                    aria-label={`${question.min} to ${question.max}`}
                  />
                  <div className="muted small" style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{question.min}</span><span>{question.max}</span>
                  </div>
                </>
              )}

              {question.type === "number" && (
                <input type="number" name={`q_${question.id}`} step="any" style={{ maxWidth: 200 }} />
              )}

              {question.type === "text" && <textarea name={`q_${question.id}`} />}
            </div>
          ))}
          <button className="btn">Submit answers</button>
        </form>
      </div>
    </Shell>
  );
}
