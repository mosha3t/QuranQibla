import { NextResponse } from "next/server";
import { getHadiths, saveHadiths, Hadith } from "@/lib/data";

export async function GET() {
    const hadiths = await getHadiths();
    return NextResponse.json(hadiths);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const hadiths = await getHadiths();

        const newHadith: Hadith = {
            id: crypto.randomUUID(),
            text: body.text,
            narrator: body.narrator,
            source: body.source,
            date: body.date,
            createdAt: new Date().toISOString(),
        };

        hadiths.unshift(newHadith);
        await saveHadiths(hadiths);

        return NextResponse.json(newHadith, { status: 201 });
    } catch {
        return NextResponse.json({ error: "خطأ في إضافة الحديث" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const hadiths = await getHadiths();

        const index = hadiths.findIndex((h) => h.id === body.id);
        if (index === -1) {
            return NextResponse.json({ error: "الحديث غير موجود" }, { status: 404 });
        }

        hadiths[index] = { ...hadiths[index], ...body };
        await saveHadiths(hadiths);

        return NextResponse.json(hadiths[index]);
    } catch {
        return NextResponse.json({ error: "خطأ في تعديل الحديث" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "معرف الحديث مطلوب" }, { status: 400 });
        }

        let hadiths = await getHadiths();
        hadiths = hadiths.filter((h) => h.id !== id);
        await saveHadiths(hadiths);

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "خطأ في حذف الحديث" }, { status: 500 });
    }
}
