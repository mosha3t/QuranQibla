import { NextResponse } from "next/server";
import { getCronLogs, clearCronLogs } from "@/lib/data";

export async function GET() {
    try {
        const logs = await getCronLogs();
        return NextResponse.json(logs);
    } catch (error) {
        console.error("[CRON LOGS API] Error:", error);
        return NextResponse.json(
            { error: "خطأ في جلب سجلات المهام" },
            { status: 500 }
        );
    }
}

export async function DELETE() {
    try {
        await clearCronLogs();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[CRON LOGS API] Error:", error);
        return NextResponse.json(
            { error: "خطأ في مسح السجلات" },
            { status: 500 }
        );
    }
}
