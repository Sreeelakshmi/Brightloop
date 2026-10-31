import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    module: "ai",
    branch: "feature/dashboard-ai",
    message: "Brightloop Gemini AI API placeholder route. Ready for Member 4 integration.",
  });
}
