import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

const MAX_FAILED_ATTEMPTS = 5;

export async function verifyAdminPin(adminId: string, pin: string) {
  const adminPin = await prisma.adminPin.findUnique({
    where: { adminId },
  });

  if (!adminPin || !adminPin.isActive) {
    return { ok: false, error: "PIN not set or disabled" };
  }

  const isValid = await bcrypt.compare(pin, adminPin.pinHash);

  if (!isValid) {
    const failed = adminPin.failedAttempts + 1;

    await prisma.adminPin.update({
      where: { adminId },
      data: {
        failedAttempts: failed,
        isActive: failed < MAX_FAILED_ATTEMPTS,
      },
    });

    return {
      ok: false,
      error:
        failed >= MAX_FAILED_ATTEMPTS
          ? "PIN locked due to multiple failures"
          : "Invalid PIN",
    };
  }

  // reset failed attempts on success
  await prisma.adminPin.update({
    where: { adminId },
    data: {
      failedAttempts: 0,
      lastUsedAt: new Date(),
    },
  });

  return { ok: true };
}
