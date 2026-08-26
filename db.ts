import Database from "better-sqlite3";
import { readFileSync } from "fs";
import path from "path";
import crypto from "crypto";

// ---------- connection (singleton across hot reloads) ----------
const globalForDb = globalThis as unknown as { sproutDb?: Database.Database };

function open() {
  const file = path.join(process.cwd(), "data", "sprout.db");
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  const schema = readFileSync(path.join(process.cwd(), "schema.sql"), "utf8");
  db.exec(schema);
  return db;
}

export const db = globalForDb.sproutDb ?? open();
if (process.env.NODE_ENV !== "production") globalForDb.sproutDb = db;

export const uid = () => crypto.randomUUID();

// ---------- row types ----------
export type User = {
  id: string; email: string; passwordHash: string; name: string;
  role: "COACH" | "CLIENT"; createdAt: string;
};
export type CheckIn = {
  id: string; userId: string; date: string;
  weightKg: number | null; sleepHours: number | null;
  energy: number | null; mood: number | null; stress: number | null;
  waterL: number | null; note: string | null;
};
export type Questionnaire = {
  id: string; slug: string; title: string; description: string; schema: string; createdAt: string;
};
export type Assignment = {
  id: string; questionnaireId: string; clientId: string; assignedById: string;
  createdAt: string; completedAt: string | null;
};
export type QResponse = {
  id: string; questionnaireId: string; userId: string; answers: string;
  score: number | null; band: string | null; createdAt: string;
};
export type Note = { id: string; clientId: string; authorId: string; body: string; createdAt: string };
export type Doc = {
  id: string; userId: string; filename: string; storedName: string;
  mimeType: string; size: number; category: string; uploadedAt: string;
};

// ---------- users ----------
export function findUserByEmail(email: string) {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email) as User | undefined;
}
export function findUserById(id: string) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
}
export function createUser(data: { email: string; passwordHash: string; name: string; role: string }) {
  const id = uid();
  db.prepare("INSERT INTO users (id, email, passwordHash, name, role) VALUES (?,?,?,?,?)")
    .run(id, data.email, data.passwordHash, data.name, data.role);
  return findUserById(id)!;
}
export function findFirstCoach() {
  return db.prepare("SELECT * FROM users WHERE role = 'COACH' ORDER BY createdAt LIMIT 1").get() as User | undefined;
}
export function listClients() {
  return db.prepare("SELECT * FROM users WHERE role = 'CLIENT' ORDER BY createdAt DESC").all() as User[];
}

// ---------- sessions ----------
export function insertSession(id: string, userId: string, expiresAt: string) {
  db.prepare("INSERT INTO sessions (id, userId, expiresAt) VALUES (?,?,?)").run(id, userId, expiresAt);
}
export function getSessionWithUser(id: string) {
  return db.prepare(
    `SELECT s.id as sessionId, s.expiresAt, u.* FROM sessions s JOIN users u ON u.id = s.userId WHERE s.id = ?`
  ).get(id) as (User & { sessionId: string; expiresAt: string }) | undefined;
}
export function deleteSession(id: string) {
  db.prepare("DELETE FROM sessions WHERE id = ?").run(id);
}

// ---------- check-ins ----------
export function upsertCheckIn(userId: string, date: string, data: Partial<Omit<CheckIn, "id" | "userId" | "date">>) {
  db.prepare(
    `INSERT INTO check_ins (id, userId, date, weightKg, sleepHours, energy, mood, stress, waterL, note)
     VALUES (@id, @userId, @date, @weightKg, @sleepHours, @energy, @mood, @stress, @waterL, @note)
     ON CONFLICT(userId, date) DO UPDATE SET
       weightKg=@weightKg, sleepHours=@sleepHours, energy=@energy, mood=@mood,
       stress=@stress, waterL=@waterL, note=@note`
  ).run({
    id: uid(), userId, date,
    weightKg: data.weightKg ?? null, sleepHours: data.sleepHours ?? null,
    energy: data.energy ?? null, mood: data.mood ?? null, stress: data.stress ?? null,
    waterL: data.waterL ?? null, note: data.note ?? null
  });
}
export function listCheckIns(userId: string, limit = 120) {
  return db.prepare(
    `SELECT * FROM (SELECT * FROM check_ins WHERE userId = ? ORDER BY date DESC LIMIT ?) ORDER BY date ASC`
  ).all(userId, limit) as CheckIn[];
}
export function getCheckIn(userId: string, date: string) {
  return db.prepare("SELECT * FROM check_ins WHERE userId = ? AND date = ?").get(userId, date) as CheckIn | undefined;
}

// ---------- questionnaires ----------
export function listQuestionnaires() {
  return db.prepare("SELECT * FROM questionnaires ORDER BY createdAt ASC").all() as Questionnaire[];
}
export function getQuestionnaireById(id: string) {
  return db.prepare("SELECT * FROM questionnaires WHERE id = ?").get(id) as Questionnaire | undefined;
}
export function getQuestionnaireBySlug(slug: string) {
  return db.prepare("SELECT * FROM questionnaires WHERE slug = ?").get(slug) as Questionnaire | undefined;
}

// ---------- assignments ----------
export function createAssignment(questionnaireId: string, clientId: string, assignedById: string) {
  db.prepare("INSERT INTO assignments (id, questionnaireId, clientId, assignedById) VALUES (?,?,?,?)")
    .run(uid(), questionnaireId, clientId, assignedById);
}
export function listPendingAssignments(clientId: string) {
  return db.prepare(
    `SELECT a.*, q.slug as qSlug, q.title as qTitle
     FROM assignments a JOIN questionnaires q ON q.id = a.questionnaireId
     WHERE a.clientId = ? AND a.completedAt IS NULL ORDER BY a.createdAt DESC`
  ).all(clientId) as (Assignment & { qSlug: string; qTitle: string })[];
}
export function completeAssignments(questionnaireId: string, clientId: string) {
  db.prepare(
    "UPDATE assignments SET completedAt = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE questionnaireId = ? AND clientId = ? AND completedAt IS NULL"
  ).run(questionnaireId, clientId);
}

// ---------- responses ----------
export function createResponse(data: { questionnaireId: string; userId: string; answers: string; score: number | null; band: string | null }) {
  db.prepare("INSERT INTO responses (id, questionnaireId, userId, answers, score, band) VALUES (?,?,?,?,?,?)")
    .run(uid(), data.questionnaireId, data.userId, data.answers, data.score, data.band);
}
export function listResponses(userId: string, limit = 20) {
  return db.prepare(
    `SELECT r.*, q.slug as qSlug, q.title as qTitle, q.schema as qSchema
     FROM responses r JOIN questionnaires q ON q.id = r.questionnaireId
     WHERE r.userId = ? ORDER BY r.createdAt DESC LIMIT ?`
  ).all(userId, limit) as (QResponse & { qSlug: string; qTitle: string; qSchema: string })[];
}

// ---------- notes ----------
export function createNote(clientId: string, authorId: string, body: string) {
  db.prepare("INSERT INTO notes (id, clientId, authorId, body) VALUES (?,?,?,?)").run(uid(), clientId, authorId, body);
}
export function listNotes(clientId: string, limit = 30) {
  return db.prepare("SELECT * FROM notes WHERE clientId = ? ORDER BY createdAt DESC LIMIT ?")
    .all(clientId, limit) as Note[];
}

// ---------- documents ----------
export function createDocument(data: Omit<Doc, "id" | "uploadedAt">) {
  db.prepare(
    "INSERT INTO documents (id, userId, filename, storedName, mimeType, size, category) VALUES (?,?,?,?,?,?,?)"
  ).run(uid(), data.userId, data.filename, data.storedName, data.mimeType, data.size, data.category);
}
export function listDocuments(userId: string) {
  return db.prepare("SELECT * FROM documents WHERE userId = ? ORDER BY uploadedAt DESC").all(userId) as Doc[];
}
export function getDocument(id: string) {
  return db.prepare("SELECT * FROM documents WHERE id = ?").get(id) as Doc | undefined;
}
export function deleteDocumentRow(id: string) {
  db.prepare("DELETE FROM documents WHERE id = ?").run(id);
}

// ---------- coach overview ----------
export function clientOverview() {
  return db.prepare(
    `SELECT u.id, u.name, u.email, u.createdAt,
       (SELECT date FROM check_ins c WHERE c.userId = u.id ORDER BY date DESC LIMIT 1) as lastCheckIn,
       (SELECT COUNT(*) FROM assignments a WHERE a.clientId = u.id AND a.completedAt IS NULL) as pendingCount,
       (SELECT uploadedAt FROM documents d WHERE d.userId = u.id ORDER BY uploadedAt DESC LIMIT 1) as lastDocument
     FROM users u WHERE u.role = 'CLIENT' ORDER BY u.createdAt DESC`
  ).all() as { id: string; name: string; email: string; createdAt: string; lastCheckIn: string | null; pendingCount: number; lastDocument: string | null }[];
}
