import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

const MAX_FAILED_ATTEMPTS = 5;

export async function verifyStaffPin(staffId: string, pin: string) {
  return prisma.$transaction(async (tx: any) => {
    const staffPin = await tx.staffPin.findUnique({
      where: { staffId },
    });

    if (!staffPin || !staffPin.isActive) {
      return { ok: false, error: "PIN not set or disabled" };
    }

    const isValid = await bcrypt.compare(pin, staffPin.pinHash);

    if (!isValid) {
      const failed = staffPin.failedAttempts + 1;

      await tx.staffPin.update({
        where: { staffId },
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
    await tx.staffPin.update({
      where: { staffId },
      data: {
        failedAttempts: 0,
        lastUsedAt: new Date(),
      },
    });

    return { ok: true };
  });
}
