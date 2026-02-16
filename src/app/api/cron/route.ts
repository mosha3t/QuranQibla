import { NextResponse } from "next/server";
import { processCronJobs } from "@/lib/cron";

const CRON_SECRET = process.env.CRON_SECRET || "";

function isAuthorized(request: Request): boolean {
    // Check Authorization header
    const authHeader = request.headers.get("authorization");
    if (authHeader === `Bearer ${CRON_SECRET}`) return true;

    // Check query parameter
    const url = new URL(request.url);
    const secret = url.searchParams.get("secret");
    if (secret === CRON_SECRET) return true;

    // Allow internal calls (no secret needed in development)
    const isInternal = request.headers.get("x-internal-cron") === "true";
    if (isInternal && process.env.NODE_ENV === "development") return true;

    return false;
}

export async function GET(request: Request) {
    if (!isAuthorized(request)) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const result = await processCronJobs();
        return NextResponse.json({
            ok: true,
            ...result,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("[CRON API] Error:", error);
        return NextResponse.json(
            {
                ok: false,
                error: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}
