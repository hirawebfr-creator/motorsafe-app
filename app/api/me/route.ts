import { NextResponse } from "next/server";
import { success } from "@/lib/api";
import { requireUser } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    return NextResponse.json(
      success({
        user,
        organisation: user.garage ?? null,
        plan: user.garage?.plan ?? "FREE",
        subscriptionStatus: user.garage?.subscriptionStatus ?? null,
        currentPeriodEnd: user.garage?.currentPeriodEnd ?? null,
      })
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
