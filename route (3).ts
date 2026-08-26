import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { getDocument } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);

  const doc = getDocument(params.id);
  if (!doc) return new NextResponse("Not found", { status: 404 });

  // Access rule: the file's owner, or the coach.
  if (doc.userId !== user.id && user.role !== "COACH") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const filePath = path.join(process.cwd(), "storage", "uploads", doc.userId, doc.storedName);
  try {
    const data = await readFile(filePath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(doc.filename)}"`,
        "Cache-Control": "private, no-store"
      }
    });
  } catch {
    return new NextResponse("File missing on disk", { status: 410 });
  }
}
