import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function DELETE(_request: Request, context: RouteContext<"/api/account/pickup-profiles/[profileId]">) {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE" || user.role !== "MERCHANT" || !user.merchantProfile) return NextResponse.json({ message: "Not authorized." }, { status: 403 });
  const { profileId } = await context.params;
  const deleted = await prisma.pickupProfile.deleteMany({ where: { id: profileId, merchantId: user.merchantProfile.id } });
  if (deleted.count !== 1) return NextResponse.json({ message: "Pickup profile not found." }, { status: 404 });
  await prisma.auditLog.create({ data: { actorId: user.id, action: "PICKUP_PROFILE_DELETED", entityType: "PickupProfile", entityId: profileId, summary: `Pickup profile ${profileId} deleted.` } });
  return NextResponse.json({ message: "Pickup profile deleted." });
}
