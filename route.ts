import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { createDocument } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "CLIENT") {
    return NextResponse.redirect(new URL("/login", req.url), 303);
  }

  const form = await req.formData();
  const file = form.get("file");
  const category = String(form.get("category") || "other");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.redirect(new URL("/documents?error=No+file+selected", req.url), 303);
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.redirect(new URL("/documents?error=File+is+larger+than+20+MB", req.url), 303);
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.redirect(new URL("/documents?error=Only+PDF+and+image+files+are+accepted", req.url), 303);
  }

  const ext = path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, "").slice(0, 10);
  const storedName = `${crypto.randomUUID()}${ext}`;
  const dir = path.join(process.cwd(), "storage", "uploads", user.id);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, storedName), Buffer.from(await file.arrayBuffer()));

  createDocument({
    userId: user.id,
    filename: file.name.slice(0, 200),
    storedName,
    mimeType: file.type,
    size: file.size,
    category
  });

  return NextResponse.redirect(new URL("/documents?uploaded=1", req.url), 303);
}
