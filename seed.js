const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const { readFileSync } = require("fs");
const { mkdirSync } = require("fs");
const path = require("path");
const crypto = require("crypto");

mkdirSync(path.join(process.cwd(), "data"), { recursive: true });
mkdirSync(path.join(process.cwd(), "storage", "uploads"), { recursive: true });

const db = new Database(path.join(process.cwd(), "data", "sprout.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(readFileSync(path.join(process.cwd(), "schema.sql"), "utf8"));

const uid = () => crypto.randomUUID();

// ---- questionnaires (original content written for this app — edit freely) ----
const intake = {
  slug: "lifestyle-baseline",
  title: "Lifestyle Baseline",
  description: "A starting snapshot of eating patterns, movement, sleep and stress. Used to build your initial plan.",
  schema: {
    questions: [
      { id: "veg", text: "How many portions of vegetables or fruit do you eat on a typical day?", type: "choice", options: [
        { label: "0–1", value: 0 }, { label: "2–3", value: 1 }, { label: "4–5", value: 2 }, { label: "More than 5", value: 3 }] },
      { id: "cook", text: "How many of your main meals per week are home-cooked?", type: "choice", options: [
        { label: "0–3", value: 0 }, { label: "4–7", value: 1 }, { label: "8–11", value: 2 }, { label: "12 or more", value: 3 }] },
      { id: "sugar", text: "How often do you have sugary drinks or sweets?", type: "choice", options: [
        { label: "Several times a day", value: 0 }, { label: "About once a day", value: 1 }, { label: "A few times a week", value: 2 }, { label: "Rarely", value: 3 }] },
      { id: "move", text: "On how many days last week were you physically active for 30 minutes or more?", type: "choice", options: [
        { label: "0", value: 0 }, { label: "1–2", value: 1 }, { label: "3–4", value: 2 }, { label: "5–7", value: 3 }] },
      { id: "sleep", text: "How many hours do you usually sleep on a work night?", type: "choice", options: [
        { label: "Under 5", value: 0 }, { label: "5–6", value: 1 }, { label: "6–7", value: 2 }, { label: "7 or more", value: 3 }] },
      { id: "stress", text: "Over the last two weeks, how often did stress affect your eating or sleep?", type: "choice", options: [
        { label: "Most days", value: 0 }, { label: "Several days", value: 1 }, { label: "Occasionally", value: 2 }, { label: "Hardly ever", value: 3 }] },
      { id: "ready", text: "How ready do you feel to change your daily habits right now?", type: "scale", min: 1, max: 10 },
      { id: "goal", text: "In your own words, what would success look like in 3 months?", type: "text" }
    ],
    bands: [
      { min: 0, max: 8, label: "Getting started", advice: "Lots of room to grow — we will pick one habit at a time." },
      { min: 9, max: 16, label: "Building momentum", advice: "Some strong habits already in place to build on." },
      { min: 17, max: 28, label: "Strong foundation", advice: "Great base — we will focus on fine-tuning and consistency." }
    ]
  }
};

const weekly = {
  slug: "weekly-wellbeing",
  title: "Weekly Wellbeing Check",
  description: "A 2-minute weekly pulse on energy, appetite, digestion, sleep and adherence.",
  schema: {
    questions: [
      { id: "energy", text: "My energy through the day this week was…", type: "choice", options: [
        { label: "Very low", value: 0 }, { label: "Low", value: 1 }, { label: "Okay", value: 2 }, { label: "Good", value: 3 }, { label: "Great", value: 4 }] },
      { id: "appetite", text: "My appetite and cravings felt…", type: "choice", options: [
        { label: "Out of control", value: 0 }, { label: "Hard to manage", value: 1 }, { label: "Manageable", value: 2 }, { label: "Steady", value: 3 }, { label: "Easy", value: 4 }] },
      { id: "digestion", text: "My digestion (bloating, discomfort, regularity) was…", type: "choice", options: [
        { label: "Bad most days", value: 0 }, { label: "Off several days", value: 1 }, { label: "Mixed", value: 2 }, { label: "Mostly fine", value: 3 }, { label: "No issues", value: 4 }] },
      { id: "sleepq", text: "My sleep quality was…", type: "choice", options: [
        { label: "Poor", value: 0 }, { label: "Below average", value: 1 }, { label: "Average", value: 2 }, { label: "Good", value: 3 }, { label: "Excellent", value: 4 }] },
      { id: "plan", text: "How closely did you follow the plan we agreed on?", type: "choice", options: [
        { label: "Not at all", value: 0 }, { label: "A little", value: 1 }, { label: "About half", value: 2 }, { label: "Mostly", value: 3 }, { label: "Fully", value: 4 }] },
      { id: "win", text: "One win from this week (however small):", type: "text" },
      { id: "hard", text: "The hardest moment this week was:", type: "text" }
    ],
    bands: [
      { min: 0, max: 7, label: "Tough week", advice: "Flagged for a supportive check-in with your coach." },
      { min: 8, max: 14, label: "Mixed week", advice: "Some friction — worth reviewing what got in the way." },
      { min: 15, max: 20, label: "Solid week", advice: "On track. Keep the routine that worked." }
    ]
  }
};

function dayStr(offset) {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function upsertUser(email, name, role, password) {
  const existing = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (existing) return existing;
  const id = uid();
  db.prepare("INSERT INTO users (id, email, passwordHash, name, role) VALUES (?,?,?,?,?)")
    .run(id, email, bcrypt.hashSync(password, 10), name, role);
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
}

const coach = upsertUser("coach@local.test", "Coach (You)", "COACH", "coach1234");
const demo = upsertUser("demo@local.test", "Demo Client", "CLIENT", "client1234");

for (const q of [intake, weekly]) {
  const existing = db.prepare("SELECT id FROM questionnaires WHERE slug = ?").get(q.slug);
  const schemaJson = JSON.stringify(q.schema);
  if (existing) {
    db.prepare("UPDATE questionnaires SET title=?, description=?, schema=? WHERE slug=?")
      .run(q.title, q.description, schemaJson, q.slug);
  } else {
    db.prepare("INSERT INTO questionnaires (id, slug, title, description, schema) VALUES (?,?,?,?,?)")
      .run(uid(), q.slug, q.title, q.description, schemaJson);
  }
}

const count = db.prepare("SELECT COUNT(*) as n FROM check_ins WHERE userId = ?").get(demo.id).n;
if (count === 0) {
  const ins = db.prepare(
    "INSERT INTO check_ins (id, userId, date, weightKg, sleepHours, energy, mood, stress, waterL, note) VALUES (?,?,?,?,?,?,?,?,?,?)"
  );
  for (let i = 20; i >= 0; i--) {
    const wobble = Math.sin(i * 1.3) * 0.4;
    ins.run(
      uid(), demo.id, dayStr(i),
      Math.round((86.5 - (20 - i) * 0.12 + wobble) * 10) / 10,
      Math.round((6.2 + Math.sin(i) * 1.1 + (20 - i) * 0.03) * 10) / 10,
      Math.min(5, Math.max(1, Math.round(2.6 + Math.sin(i * 0.8) + (20 - i) * 0.05))),
      Math.min(5, Math.max(1, Math.round(3 + Math.cos(i * 0.6)))),
      Math.min(5, Math.max(1, Math.round(3.4 - (20 - i) * 0.04 + Math.sin(i * 0.5)))),
      Math.round((1.4 + (20 - i) * 0.04) * 10) / 10,
      i === 0 ? "Felt good today, easy to stick to the plan." : null
    );
  }
  const intakeRow = db.prepare("SELECT id FROM questionnaires WHERE slug = 'lifestyle-baseline'").get();
  db.prepare("INSERT INTO assignments (id, questionnaireId, clientId, assignedById) VALUES (?,?,?,?)")
    .run(uid(), intakeRow.id, demo.id, coach.id);
}

console.log("Database ready at data/sprout.db");
console.log("Coach login:  coach@local.test / coach1234");
console.log("Demo client:  demo@local.test / client1234");
