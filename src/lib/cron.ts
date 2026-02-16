import {
    getNotifications,
    saveNotifications,
    getHadiths,
    saveHadiths,
    saveCronLog,
    CronLog,
} from "./data";
import { sendNotificationToTopic, FCMPayload } from "./firebase";

const TIMEZONE = process.env.CRON_TIMEZONE || "Africa/Cairo";
const HADITH_SEND_TIME = process.env.HADITH_SEND_TIME || "09:00";

/**
 * Get the current date/time in the configured timezone.
 */
function getNow() {
    const now = new Date();
    // Format in the target timezone
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const get = (type: string) =>
        parts.find((p) => p.type === type)?.value || "";

    return {
        date: `${get("year")}-${get("month")}-${get("day")}`, // e.g. "2026-02-16"
        time: `${get("hour")}:${get("minute")}`, // e.g. "20:15"
        dayOfWeek: new Date(
            now.toLocaleString("en-US", { timeZone: TIMEZONE })
        ).getDay(), // 0=Sunday
        iso: now.toISOString(),
    };
}

async function logCron(
    partial: Omit<CronLog, "id" | "timestamp">
): Promise<void> {
    const log: CronLog = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        ...partial,
    };
    await saveCronLog(log);
}

/**
 * Process all due scheduled/recurring notifications AND today's hadith.
 * Returns a summary of what was processed.
 */
export async function processCronJobs(): Promise<{
    processed: number;
    errors: number;
    details: string[];
}> {
    const result = { processed: 0, errors: 0, details: [] as string[] };
    const now = getNow();

    console.log(`[CRON] Running at ${now.date} ${now.time} (${TIMEZONE}), dayOfWeek=${now.dayOfWeek}`);

    // ========================================
    // 1. PROCESS NOTIFICATIONS
    // ========================================
    const notifications = await getNotifications();
    let notificationsModified = false;

    for (const notification of notifications) {
        if (!notification.active) continue;

        // --- SCHEDULED: one-time at specific date + time ---
        if (notification.type === "scheduled") {
            if (
                notification.scheduledDate === now.date &&
                notification.scheduledTime === now.time &&
                !notification.sentAt
            ) {
                const payload: FCMPayload = {
                    title: notification.title,
                    body: notification.body,
                };

                try {
                    await sendNotificationToTopic(payload);
                    notification.sentAt = now.iso;
                    notification.active = false; // one-time, mark done
                    notificationsModified = true;
                    result.processed++;
                    result.details.push(
                        `✅ Scheduled "${notification.title}" sent`
                    );

                    await logCron({
                        type: "scheduled",
                        notificationId: notification.id,
                        notificationTitle: notification.title,
                        status: "success",
                        message: `تم إرسال الإشعار المجدول "${notification.title}" بنجاح`,
                    });
                } catch (error) {
                    result.errors++;
                    const errMsg =
                        error instanceof Error
                            ? error.message
                            : String(error);
                    result.details.push(
                        `❌ Scheduled "${notification.title}" failed: ${errMsg}`
                    );

                    await logCron({
                        type: "scheduled",
                        notificationId: notification.id,
                        notificationTitle: notification.title,
                        status: "error",
                        message: `فشل إرسال الإشعار المجدول "${notification.title}": ${errMsg}`,
                    });
                }
            }
        }

        // --- RECURRING: weekly on specific days at specific time ---
        if (notification.type === "recurring") {
            const isDayMatch =
                notification.recurringDays?.includes(now.dayOfWeek) ?? false;
            const isTimeMatch = notification.recurringTime === now.time;

            if (isDayMatch && isTimeMatch) {
                // Check if already sent in this minute window
                if (notification.lastSentAt) {
                    const lastSent = new Date(notification.lastSentAt);
                    const diffMs = Date.now() - lastSent.getTime();
                    // Skip if sent in the last 90 seconds (avoid duplicate sends)
                    if (diffMs < 90_000) {
                        continue;
                    }
                }

                const payload: FCMPayload = {
                    title: notification.title,
                    body: notification.body,
                };

                try {
                    await sendNotificationToTopic(payload);
                    notification.lastSentAt = now.iso;
                    notificationsModified = true;
                    result.processed++;
                    result.details.push(
                        `✅ Recurring "${notification.title}" sent`
                    );

                    await logCron({
                        type: "recurring",
                        notificationId: notification.id,
                        notificationTitle: notification.title,
                        status: "success",
                        message: `تم إرسال الإشعار المتكرر "${notification.title}" بنجاح`,
                    });
                } catch (error) {
                    result.errors++;
                    const errMsg =
                        error instanceof Error
                            ? error.message
                            : String(error);
                    result.details.push(
                        `❌ Recurring "${notification.title}" failed: ${errMsg}`
                    );

                    await logCron({
                        type: "recurring",
                        notificationId: notification.id,
                        notificationTitle: notification.title,
                        status: "error",
                        message: `فشل إرسال الإشعار المتكرر "${notification.title}": ${errMsg}`,
                    });
                }
            }
        }
    }

    if (notificationsModified) {
        await saveNotifications(notifications);
    }

    // ========================================
    // 2. PROCESS HADITHS (send today's hadith at HADITH_SEND_TIME)
    // ========================================
    if (now.time === HADITH_SEND_TIME) {
        const hadiths = await getHadiths();
        const todayHadith = hadiths.find(
            (h) => h.date === now.date && !h.sentAt
        );

        if (todayHadith) {
            const payload: FCMPayload = {
                title: "حديث اليوم 🌿",
                body: todayHadith.text,
            };

            try {
                await sendNotificationToTopic(payload);
                todayHadith.sentAt = now.iso;
                await saveHadiths(hadiths);
                result.processed++;
                result.details.push(
                    `✅ Hadith of the day sent`
                );

                await logCron({
                    type: "hadith",
                    notificationId: todayHadith.id,
                    notificationTitle: "حديث اليوم 🌿",
                    status: "success",
                    message: `تم إرسال حديث اليوم بنجاح`,
                });
            } catch (error) {
                result.errors++;
                const errMsg =
                    error instanceof Error ? error.message : String(error);
                result.details.push(
                    `❌ Hadith of the day failed: ${errMsg}`
                );

                await logCron({
                    type: "hadith",
                    notificationId: todayHadith.id,
                    notificationTitle: "حديث اليوم 🌿",
                    status: "error",
                    message: `فشل إرسال حديث اليوم: ${errMsg}`,
                });
            }
        }
    }

    // ========================================
    // 3. SUMMARY
    // ========================================
    if (result.processed === 0 && result.errors === 0) {
        console.log("[CRON] No notifications due at this time.");
    } else {
        console.log(
            `[CRON] Done: ${result.processed} sent, ${result.errors} errors`
        );
    }

    return result;
}
