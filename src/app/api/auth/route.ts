import { NextResponse } from "next/server";
import { createSession, destroySession, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const { password } = await request.json();

        if (!verifyPassword(password)) {
            return NextResponse.json(
                { error: "كلمة المرور غير صحيحة" },
                { status: 401 }
            );
        }

        await createSession();
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json(
            { error: "حدث خطأ غير متوقع" },
            { status: 500 }
        );
    }
}

export async function DELETE() {
    await destroySession();
    return NextResponse.json({ success: true });
}
