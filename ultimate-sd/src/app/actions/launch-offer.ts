"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
  claimPlatformLaunchOffer,
  drawAiGiveawayWinners,
  getLaunchOfferRedemptions,
} from "@/lib/launch-offer-grant";
import * as grantLogic from "@/lib/launch-offer-grant";
import { buildLaunchOfferStats } from "@/lib/launch-offer";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    throw new Error("Not authorized");
  }

  return session.user.id;
}

export async function claimLaunchPlatformAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "not_authenticated" as const };
  }

  const result = await claimPlatformLaunchOffer(session.user.id);

  if ("success" in result && result.success) {
    revalidatePath("/");
    revalidatePath("/pricing");
    revalidatePath("/admin");
  }

  return result;
}

export async function drawAiGiveawayWinnersAction() {
  const adminId = await requireAdmin();
  const result = await drawAiGiveawayWinners(adminId);

  if ("success" in result && result.success) {
    revalidatePath("/admin");
    revalidatePath("/pricing");
  }

  return result;
}

export async function getLaunchOfferStats() {
  try {
    return await grantLogic.getLaunchOfferStats();
  } catch (error) {
    console.warn("Failed to get launch offer stats in action:", error);
    return buildLaunchOfferStats(0, 0, 0);
  }
}

export async function getLaunchOfferUserState(userId: string) {
  try {
    return await grantLogic.getLaunchOfferUserState(userId);
  } catch (error) {
    console.warn("Failed to get launch offer user state in action:", error);
    return {
      hasRedeemed: false,
      redemptionKind: null,
      isEligibleForAiDraw: false,
    };
  }
}

export { getLaunchOfferRedemptions };
