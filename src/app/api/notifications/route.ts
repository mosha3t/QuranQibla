import { NextResponse } from "next/server";
import {
    getNotifications,
    saveNotifications,
    Notification,
} from "@/lib/data";
import { sendNotificationToTopic } from "@/lib/firebase";

export async function GET() {
    const notifications = await getNotifications();
    return NextResponse.json(notifications);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const notifications = await getNotifications();

        const newNotification: Notification = {
            id: crypto.randomUUID(),
            title: body.title,
            body: body.body,
            type: body.type,
            scheduledDate: body.scheduledDate,
            scheduledTime: body.scheduledTime,
            recurringDays: body.recurringDays,
            recurringTime: body.recurringTime,
            active: body.active !== false,
            createdAt: new Date().toISOString(),
        };

        // Send FCM notification for immediate type
        if (body.type === "immediate") {
            try {
                await sendNotificationToTopic({
                    title: body.title,
                    body: body.body,
                });
                console.log("[API] FCM notification sent successfully");
            } catch (fcmError) {
                console.error("[API] FCM send failed:", fcmError);
                // Still try to save the notification even if FCM fails
                // but report the error to the client
                notifications.unshift(newNotification);
                try {
                    await saveNotifications(notifications);
                } catch (storageError) {
                    console.error(
                        "[API] Failed to persist notification after FCM error:",
                        storageError
                    );
                }
                return NextResponse.json(
                    {
                        ...newNotification,
                        fcmError: "تم حفظ الإشعار لكن فشل الإرسال عبر Firebase",
                    },
                    { status: 207 }
                );
            }
        }

        notifications.unshift(newNotification);
        try {
            await saveNotifications(notifications);
        } catch (storageError) {
            // On platforms like Vercel, the filesystem may be read-only or ephemeral.
            // We don't want to fail the whole request if persistence fails,
            // since the push notification itself may have been sent successfully.
            console.error(
                "[API] Failed to persist notification after send:",
                storageError
            );
            return NextResponse.json(
                {
                    ...newNotification,
                    storageError:
                        "تم إرسال الإشعار بنجاح لكن تعذّر حفظه في السجل (تخزين غير متاح على الخادم).",
                },
                { status: 207 }
            );
        }

        return NextResponse.json(newNotification, { status: 201 });
    } catch (error) {
        console.error("[API] Error:", error);
        return NextResponse.json(
            { error: "خطأ في إضافة الإشعار" },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const notifications = await getNotifications();

        const index = notifications.findIndex((n) => n.id === body.id);
        if (index === -1) {
            return NextResponse.json(
                { error: "الإشعار غير موجود" },
                { status: 404 }
            );
        }

        notifications[index] = { ...notifications[index], ...body };
        await saveNotifications(notifications);

        return NextResponse.json(notifications[index]);
    } catch {
        return NextResponse.json(
            { error: "خطأ في تعديل الإشعار" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "معرف الإشعار مطلوب" },
                { status: 400 }
            );
        }

        let notifications = await getNotifications();
        notifications = notifications.filter((n) => n.id !== id);
        await saveNotifications(notifications);

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json(
            { error: "خطأ في حذف الإشعار" },
            { status: 500 }
        );
    }
}
