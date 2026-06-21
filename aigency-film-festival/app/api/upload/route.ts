import { NextRequest, NextResponse } from "next/server";
import { storageConfigured, uploadPoster } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file provided." }, { status: 400 });
    if (!storageConfigured()) return NextResponse.json({ url: null, configured: false });
    if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "Image too large (max 8MB)." }, { status: 400 });

    const url = await uploadPoster(file);
    return NextResponse.json({ url, configured: true });
  } catch (e) {
    console.error("[upload]", e);
    return NextResponse.json({ url: null, error: "Upload failed." }, { status: 500 });
  }
}
