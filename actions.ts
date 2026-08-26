"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { unlink } from "fs/promises";
import path from "path";
import {
  findUserByEmail, findUserById, createUser, findFirstCoach,
  upsertCheckIn, getQuestionnaireBySlug, createResponse, completeAssignments,
  getQuestionnaireById, createAssignment, createNote, getDocument, deleteDocumentRow
} from "./db";
import { createSession, destroySession, requireUser, todayStr } from "./auth";
import { parseSchema, scoreAnswers } from "./questionnaire";

function clean(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function loginAction(formData: FormData) {
  const email = clean(formData.get("email")).toLowerCase();
  const password = clean(formData.get("password"));
  const user = findUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    redirect("/login?error=Invalid+email+or+password");
  }
  await createSession(user.id);
  redirect(user.role === "COACH" ? "/coach" : "/dashboard");
}

export async function registerAction(formData: FormData) {
  const name = clean(formData.get("name"));
  const email = clean(formData.get("email")).toLowerCase();
  const password = clean(formData.get("password"));
  if (!name || !email || password.length < 8) {
    redirect("/register?error=Fill+all+fields.+Password+needs+8%2B+characters.");
  }
  if (findUserByEmail(email)) {
    redirect("/register?error=An+account+with+this+email+already+exists");
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = createUser({ name, email, passwordHash, role: "CLIENT" });

  // Every new client automatically receives the intake questionnaire.
  const intake = getQuestionnaireBySlug("lifestyle-baseline");
  const coach = findFirstCoach();
  if (intake && coach) createAssignment(intake.id, user.id, coach.id);

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function checkInAction(formData: FormData) {
  const user = await requireUser("CLIENT");
  const date = clean(formData.get("date")) || todayStr();
  const num = (k: string) => {
    const v = clean(formData.get(k));
    if (v === "") return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(`${date}T00:00:00Z`).getTime())) {
    redirect("/checkin?error=Invalid+date");
  }
  const bounded = (key: string, min: number, max: number) => {
    const value = num(key);
    return value == null ? null : Math.min(max, Math.max(min, value));
  };
  upsertCheckIn(user.id, date, {
    weightKg: bounded("weightKg", 0, 500),
    sleepHours: bounded("sleepHours", 0, 24),
    energy: bounded("energy", 1, 5),
    mood: bounded("mood", 1, 5),
    stress: bounded("stress", 1, 5),
    waterL: bounded("waterL", 0, 30),
    note: clean(formData.get("note")).slice(0, 2000) || null
  });
  revalidatePath("/dashboard");
  redirect("/dashboard?saved=1");
}

export async function submitQuestionnaireAction(formData: FormData) {
  const user = await requireUser("CLIENT");
  const slug = clean(formData.get("slug"));
  const q = getQuestionnaireBySlug(slug);
  if (!q) redirect("/questionnaires");

  const schema = parseSchema(q.schema);
  const answers: Record<string, string> = {};
  for (const question of schema.questions) {
    answers[question.id] = clean(formData.get(`q_${question.id}`));
  }
  const { score, band } = scoreAnswers(schema, answers);

  createResponse({ questionnaireId: q.id, userId: user.id, answers: JSON.stringify(answers), score, band });
  completeAssignments(q.id, user.id);

  revalidatePath("/questionnaires");
  redirect("/questionnaires?done=1");
}

export async function addNoteAction(formData: FormData) {
  const coach = await requireUser("COACH");
  const clientId = clean(formData.get("clientId"));
  const body = clean(formData.get("body"));
  const client = findUserById(clientId);
  if (!client || client.role !== "CLIENT" || !body) redirect("/coach");
  createNote(clientId, coach.id, body.slice(0, 5000));
  revalidatePath(`/coach/clients/${clientId}`);
  redirect(`/coach/clients/${clientId}`);
}

export async function assignQuestionnaireAction(formData: FormData) {
  const coach = await requireUser("COACH");
  const clientId = clean(formData.get("clientId"));
  const questionnaireId = clean(formData.get("questionnaireId"));
  const client = findUserById(clientId);
  const questionnaire = getQuestionnaireById(questionnaireId);
  if (!client || client.role !== "CLIENT" || !questionnaireId || !questionnaire) redirect("/coach");
  createAssignment(questionnaire.id, client.id, coach.id);
  revalidatePath(`/coach/clients/${clientId}`);
  redirect(`/coach/clients/${clientId}`);
}

export async function deleteDocumentAction(formData: FormData) {
  const user = await requireUser();
  const id = clean(formData.get("id"));
  const doc = getDocument(id);
  if (doc && (doc.userId === user.id || user.role === "COACH")) {
    deleteDocumentRow(id);
    await unlink(path.join(process.cwd(), "storage", "uploads", doc.userId, doc.storedName)).catch(() => {});
  }
  revalidatePath("/documents");
  redirect(user.role === "COACH" ? `/coach/clients/${doc?.userId ?? ""}` : "/documents");
}
