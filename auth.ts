import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";
import { insertSession, getSessionWithUser, deleteSession, type User } from "./db";

const COOKIE = "sprout_session";
const SESSION_DAYS = 14;

export async function createSession(userId: string) {
  const id = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000);
  insertSession(id, userId, expiresAt.toISOString());
  cookies().set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // local-only app; set true if you ever serve over HTTPS
    path: "/",
    expires: expiresAt
  });
}

export async function destroySession() {
  const id = cookies().get(COOKIE)?.value;
  if (id) deleteSession(id);
  cookies().delete(COOKIE);
}

export async function getSessionUser(): Promise<User | null> {
  const id = cookies().get(COOKIE)?.value;
  if (!id) return null;
  const row = getSessionWithUser(id);
  if (!row) return null;
  if (new Date(row.expiresAt) < new Date()) {
    deleteSession(id);
    return null;
  }
  const { sessionId, expiresAt, ...user } = row;
  return user as User;
}

export async function requireUser(role?: "COACH" | "CLIENT"): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (role && user.role !== role) redirect(user.role === "COACH" ? "/coach" : "/dashboard");
  return user;
}

export function todayStr() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
