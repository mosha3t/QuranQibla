"use client";

import { useState, useEffect, useCallback } from "react";

interface CronLog {
    id: string;
    timestamp: string;
    type: "scheduled" | "recurring" | "system";
    notificationId?: string;
    notificationTitle?: string;
    status: "success" | "error";
    message: string;
}

const TYPE_LABELS: Record<string, { label: string; icon: string }> = {
    scheduled: { label: "مجدول", icon: "📅" },
    recurring: { label: "متكرر", icon: "🔁" },
    hadith: { label: "حديث", icon: "🌿" },
    system: { label: "نظام", icon: "⚙️" },
};

export default function CronLogsPage() {
    const [logs, setLogs] = useState<CronLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [clearing, setClearing] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    const fetchLogs = useCallback(async () => {
        try {
            const res = await fetch("/api/cron-logs");
            const data = await res.json();
            if (Array.isArray(data)) {
                setLogs(data);
            }
        } catch (err) {
            console.error("Error fetching cron logs:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchLogs, 30_000);
        return () => clearInterval(interval);
    }, [fetchLogs]);

    const handleClear = async () => {
        setClearing(true);
        try {
            await fetch("/api/cron-logs", { method: "DELETE" });
            setLogs([]);
            setDeleteConfirm(false);
        } catch (err) {
            console.error("Error clearing cron logs:", err);
        } finally {
            setClearing(false);
        }
    };

    const handleTriggerCron = async () => {
        try {
            const res = await fetch("/api/cron?secret=internal-dev", {
                headers: { "x-internal-cron": "true" },
            });
            const data = await res.json();
            console.log("[CRON] Manual trigger result:", data);
            // Refresh logs after triggering
            setTimeout(fetchLogs, 1000);
        } catch (err) {
            console.error("Error triggering cron:", err);
        }
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString("ar-EG", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    const successCount = logs.filter((l) => l.status === "success").length;
    const errorCount = logs.filter((l) => l.status === "error").length;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary">
                        سجل المهام المجدولة
                    </h2>
                    <p className="text-sm text-text-secondary mt-1">
                        متابعة تنفيذ الإشعارات المجدولة والمتكررة
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleTriggerCron}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gold-600/15 text-gold-500 border border-border-gold font-medium rounded-xl transition-all duration-200 text-sm hover:bg-gold-600/25 cursor-pointer"
                    >
                        <span>▶️</span>
                        تشغيل يدوي
                    </button>
                    {deleteConfirm ? (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handleClear}
                                disabled={clearing}
                                className="px-3 py-2.5 text-sm bg-danger rounded-xl text-white hover:bg-danger-hover transition-all cursor-pointer disabled:opacity-50"
                            >
                                {clearing ? "جاري المسح..." : "تأكيد المسح"}
                            </button>
                            <button
                                onClick={() => setDeleteConfirm(false)}
                                className="px-3 py-2.5 text-sm bg-bg-card-hover rounded-xl text-text-secondary hover:text-text-primary transition-all cursor-pointer"
                            >
                                إلغاء
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setDeleteConfirm(true)}
                            disabled={logs.length === 0}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-bg-card border border-border-default text-text-secondary font-medium rounded-xl transition-all duration-200 text-sm hover:border-danger hover:text-danger cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <span>🗑️</span>
                            مسح السجل
                        </button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    {
                        label: "إجمالي العمليات",
                        value: logs.length,
                        icon: "📋",
                    },
                    {
                        label: "ناجحة",
                        value: successCount,
                        icon: "✅",
                    },
                    {
                        label: "فاشلة",
                        value: errorCount,
                        icon: "❌",
                    },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-bg-card border border-border-default rounded-xl p-4 flex items-center gap-3"
                    >
                        <div className="w-10 h-10 rounded-lg bg-gold-600/10 flex items-center justify-center text-lg">
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gold-500">
                                {stat.value}
                            </p>
                            <p className="text-xs text-text-secondary">
                                {stat.label}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Logs list */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-gold-600/30 border-t-gold-600 rounded-full animate-spin" />
                </div>
            ) : logs.length === 0 ? (
                <div className="text-center py-12 bg-bg-card border border-border-default rounded-xl">
                    <span className="text-4xl block mb-3">📋</span>
                    <p className="text-text-secondary">
                        لا توجد سجلات بعد. ستظهر هنا عند تنفيذ المهام المجدولة.
                    </p>
                    <p className="text-xs text-text-secondary/60 mt-2">
                        يتم التحديث تلقائياً كل 30 ثانية
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {logs.map((log, i) => {
                        const typeInfo = TYPE_LABELS[log.type] || {
                            label: log.type,
                            icon: "📌",
                        };
                        return (
                            <div
                                key={log.id}
                                className={`bg-bg-card border rounded-xl p-4 transition-all duration-200 animate-slide-up ${log.status === "success"
                                    ? "border-success/20 hover:border-success/40"
                                    : "border-danger/20 hover:border-danger/40"
                                    }`}
                                style={{ animationDelay: `${i * 30}ms` }}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            {/* Status badge */}
                                            <span
                                                className={`text-xs px-2.5 py-0.5 rounded-lg font-medium ${log.status === "success"
                                                    ? "bg-success/10 text-success"
                                                    : "bg-danger/10 text-danger"
                                                    }`}
                                            >
                                                {log.status === "success"
                                                    ? "✅ نجح"
                                                    : "❌ فشل"}
                                            </span>

                                            {/* Type badge */}
                                            <span className="text-xs px-2.5 py-0.5 rounded-lg bg-gold-600/10 text-gold-500">
                                                {typeInfo.icon} {typeInfo.label}
                                            </span>

                                            {/* Notification title */}
                                            {log.notificationTitle && (
                                                <span className="text-sm font-medium text-text-primary">
                                                    {log.notificationTitle}
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-sm text-text-secondary leading-relaxed">
                                            {log.message}
                                        </p>
                                    </div>

                                    <span className="text-xs text-text-secondary/60 shrink-0 whitespace-nowrap">
                                        {formatTime(log.timestamp)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
