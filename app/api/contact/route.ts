import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, phone, email, location } = await req.json();

    if (!name?.trim() || !phone?.trim() || !email?.trim() || !location?.trim()) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const submission = await prisma.contactSubmission.create({
      data: {
        name:     name.trim(),
        phone:    phone.trim(),
        email:    email.trim().toLowerCase(),
        location: location.trim(),
      },
    });

    return NextResponse.json({ ok: true, id: submission.id });
  } catch {
    return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });
  }
}
