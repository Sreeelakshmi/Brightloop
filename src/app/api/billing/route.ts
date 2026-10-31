import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    module: "billing",
    branch: "feature/billing-payments",
    message: "Brightloop Billing API placeholder route. Ready for Member 3 implementation.",
  });
}
