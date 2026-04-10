import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  if (!rateLimit(ip, 5, 60_000))
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  try {
    const { name, phone, email, location } = await req.json();

    if (!name?.trim() || !phone?.trim() || !email?.trim() || !location?.trim())
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });

    if (name.length > 100 || location.length > 200)
      return NextResponse.json({ error: "Input too long" }, { status: 400 });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });

    if (!/^\+?[\d\s\-()\u00AD]{7,20}$/.test(phone))
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });

    const submission = await prisma.contactSubmission.create({
      data: {
        name:     name.trim().slice(0, 100),
        phone:    phone.trim().slice(0, 20),
        email:    email.trim().toLowerCase().slice(0, 254),
        location: location.trim().slice(0, 200),
      },
    });

    return NextResponse.json({ ok: true, id: submission.id });
  } catch {
    return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });
  }
}
