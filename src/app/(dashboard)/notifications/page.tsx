"use client";

import { useState, useEffect, useCallback } from "react";

interface Notification {
    id: string;
    title: string;
    body: string;
    type: "immediate" | "scheduled" | "recurring";
    scheduledDate?: string;
    scheduledTime?: string;
    recurringDays?: number[];
    recurringTime?: string;
    active: boolean;
    createdAt: string;
}

const DAY_NAMES = [
    { id: 0, label: "الأحد" },
    { id: 1, label: "الإثنين" },
    { id: 2, label: "الثلاثاء" },
    { id: 3, label: "الأربعاء" },
    { id: 4, label: "الخميس" },
    { id: 5, label: "الجمعة" },
    { id: 6, label: "السبت" },
];

type Tab = "immediate" | "scheduled" | "recurring";

const TAB_CONFIG: { key: Tab; label: string; icon: string }[] = [
    { key: "immediate", label: "إرسال فوري", icon: "🚀" },
    { key: "scheduled", label: "مجدول", icon: "📅" },
    { key: "recurring", label: "متكرر أسبوعياً", icon: "🔁" },
];

const EMPTY_FORM = {
    title: "",
    body: "",
    scheduledDate: "",
    scheduledTime: "",
    recurringDays: [] as number[],
    recurringTime: "",
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>("immediate");
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState("");

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch("/api/notifications");
            const data = await res.json();
            setNotifications(data);
        } catch (err) {
            console.error("Error fetching notifications:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg("");

        try {
            const payload = {
                title: form.title,
                body: form.body,
                type: activeTab,
                ...(activeTab === "scheduled" && {
                    scheduledDate: form.scheduledDate,
                    scheduledTime: form.scheduledTime,
                }),
                ...(activeTab === "recurring" && {
                    recurringDays: form.recurringDays,
                    recurringTime: form.recurringTime,
                }),
                active: true,
            };

            const res = await fetch("/api/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            setForm(EMPTY_FORM);

            if (res.status === 207 && data.fcmError) {
                // Saved but FCM failed
                setErrorMsg("⚠️ تم حفظ الإشعار لكن فشل الإرسال عبر Firebase. تأكد من إعداد ملف الخدمة.");
                setTimeout(() => setErrorMsg(""), 5000);
            } else if (res.ok) {
                setSuccessMsg(
                    activeTab === "immediate"
                        ? "تم إرسال الإشعار لجميع المستخدمين بنجاح! 🎉"
                        : activeTab === "scheduled"
                            ? "تم جدولة الإشعار بنجاح! 📅"
                            : "تم إنشاء الإشعار المتكرر بنجاح! 🔁"
                );
                setTimeout(() => setSuccessMsg(""), 3000);
            } else {
                setErrorMsg("❌ حدث خطأ أثناء حفظ الإشعار");
                setTimeout(() => setErrorMsg(""), 5000);
            }

            await fetchNotifications();
        } catch (err) {
            console.error("Error saving notification:", err);
            setErrorMsg("❌ حدث خطأ في الاتصال");
            setTimeout(() => setErrorMsg(""), 5000);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
            setDeleteConfirm(null);
            await fetchNotifications();
        } catch (err) {
            console.error("Error deleting notification:", err);
        }
    };

    const toggleActive = async (notification: Notification) => {
        try {
            await fetch("/api/notifications", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: notification.id, active: !notification.active }),
            });
            await fetchNotifications();
        } catch (err) {
            console.error("Error toggling notification:", err);
        }
    };

    const toggleDay = (dayId: number) => {
        setForm((prev) => ({
            ...prev,
            recurringDays: prev.recurringDays.includes(dayId)
                ? prev.recurringDays.filter((d) => d !== dayId)
                : [...prev.recurringDays, dayId],
        }));
    };

    const filteredNotifications = notifications.filter(
        (n) => n.type === activeTab
    );

    const getTypeLabel = (type: string) => {
        return TAB_CONFIG.find((t) => t.key === type)?.label || type;
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-text-primary">إدارة الإشعارات</h2>
                <p className="text-sm text-text-secondary mt-1">
                    أرسل إشعارات فورية أو جدولها لوقت محدد
                </p>
            </div>

            {/* Success Message */}
            {successMsg && (
                <div className="p-4 bg-success/10 border border-success/20 rounded-xl text-center animate-slide-up">
                    <p className="text-success font-medium">{successMsg}</p>
                </div>
            )}

            {/* Error Message */}
            {errorMsg && (
                <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-center animate-slide-up">
                    <p className="text-danger font-medium">{errorMsg}</p>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-bg-card rounded-xl border border-border-default overflow-x-auto">
                {TAB_CONFIG.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 min-w-fit flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap cursor-pointer ${activeTab === tab.key
                            ? "bg-gold-600/15 text-gold-500 border border-border-gold"
                            : "text-text-secondary hover:text-text-primary hover:bg-bg-card-hover"
                            }`}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Form */}
            <form
                onSubmit={handleSubmit}
                className="bg-bg-card border border-border-default rounded-2xl p-6 space-y-5"
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                        <label className="block text-sm text-text-secondary mb-1.5">
                            عنوان الإشعار
                        </label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            className="w-full px-4 py-3 bg-bg-input border border-border-default rounded-xl text-text-primary placeholder:text-text-secondary/50 text-right focus:border-gold-600 focus:ring-1 focus:ring-gold-600 transition-all"
                            placeholder="مثال: تذكير بقراءة القرآن"
                            required
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm text-text-secondary mb-1.5">
                            نص الإشعار
                        </label>
                        <textarea
                            value={form.body}
                            onChange={(e) => setForm({ ...form, body: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 bg-bg-input border border-border-default rounded-xl text-text-primary placeholder:text-text-secondary/50 text-right resize-none focus:border-gold-600 focus:ring-1 focus:ring-gold-600 transition-all"
                            placeholder="أدخل نص الإشعار..."
                            required
                        />
                    </div>
                </div>

                {/* Scheduled fields */}
                {activeTab === "scheduled" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-up">
                        <div>
                            <label className="block text-sm text-text-secondary mb-1.5">
                                التاريخ
                            </label>
                            <input
                                type="date"
                                value={form.scheduledDate}
                                onChange={(e) =>
                                    setForm({ ...form, scheduledDate: e.target.value })
                                }
                                className="w-full px-4 py-3 bg-bg-input border border-border-default rounded-xl text-text-primary focus:border-gold-600 focus:ring-1 focus:ring-gold-600 transition-all"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-text-secondary mb-1.5">
                                الوقت
                            </label>
                            <input
                                type="time"
                                value={form.scheduledTime}
                                onChange={(e) =>
                                    setForm({ ...form, scheduledTime: e.target.value })
                                }
                                className="w-full px-4 py-3 bg-bg-input border border-border-default rounded-xl text-text-primary focus:border-gold-600 focus:ring-1 focus:ring-gold-600 transition-all"
                                required
                            />
                        </div>
                    </div>
                )}

                {/* Recurring fields */}
                {activeTab === "recurring" && (
                    <div className="space-y-4 animate-slide-up">
                        <div>
                            <label className="block text-sm text-text-secondary mb-3">
                                أيام التكرار
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {DAY_NAMES.map((day) => (
                                    <button
                                        key={day.id}
                                        type="button"
                                        onClick={() => toggleDay(day.id)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${form.recurringDays.includes(day.id)
                                            ? "bg-gold-600 text-bg-primary"
                                            : "bg-bg-input border border-border-default text-text-secondary hover:border-gold-600 hover:text-gold-500"
                                            }`}
                                    >
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="max-w-xs">
                            <label className="block text-sm text-text-secondary mb-1.5">
                                الوقت
                            </label>
                            <input
                                type="time"
                                value={form.recurringTime}
                                onChange={(e) =>
                                    setForm({ ...form, recurringTime: e.target.value })
                                }
                                className="w-full px-4 py-3 bg-bg-input border border-border-default rounded-xl text-text-primary focus:border-gold-600 focus:ring-1 focus:ring-gold-600 transition-all"
                                required
                            />
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={
                        saving ||
                        (activeTab === "recurring" && form.recurringDays.length === 0)
                    }
                    className="w-full sm:w-auto px-8 py-3 bg-gold-600 hover:bg-gold-500 text-bg-primary font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                    {saving
                        ? "جاري الإرسال..."
                        : activeTab === "immediate"
                            ? "🚀 إرسال الآن"
                            : activeTab === "scheduled"
                                ? "📅 جدولة"
                                : "🔁 إنشاء تكرار"}
                </button>
            </form>

            {/* Notifications list */}
            <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                    {getTypeLabel(activeTab)} — السجل
                    <span className="text-sm font-normal text-text-secondary mr-2">
                        ({filteredNotifications.length})
                    </span>
                </h3>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-2 border-gold-600/30 border-t-gold-600 rounded-full animate-spin" />
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="text-center py-12 bg-bg-card border border-border-default rounded-xl">
                        <span className="text-4xl block mb-3">🔕</span>
                        <p className="text-text-secondary">
                            لا توجد إشعارات من هذا النوع بعد
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredNotifications.map((notification, i) => (
                            <div
                                key={notification.id}
                                className={`bg-bg-card border rounded-xl p-5 transition-all duration-200 animate-slide-up ${notification.active
                                    ? "border-border-default hover:border-border-gold"
                                    : "border-border-default opacity-50"
                                    }`}
                                style={{ animationDelay: `${i * 50}ms` }}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-text-primary text-sm">
                                                {notification.title}
                                            </h4>
                                            {!notification.active && (
                                                <span className="text-xs px-2 py-0.5 bg-text-secondary/10 rounded-md text-text-secondary">
                                                    معطّل
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-text-secondary text-sm mb-3 leading-relaxed">
                                            {notification.body}
                                        </p>

                                        <div className="flex flex-wrap gap-2 text-xs text-text-secondary">
                                            {notification.scheduledDate && (
                                                <span className="inline-flex items-center gap-1 bg-gold-600/10 px-2.5 py-1 rounded-lg">
                                                    📅 {notification.scheduledDate}
                                                </span>
                                            )}
                                            {notification.scheduledTime && (
                                                <span className="inline-flex items-center gap-1 bg-gold-600/10 px-2.5 py-1 rounded-lg">
                                                    🕐 {notification.scheduledTime}
                                                </span>
                                            )}
                                            {notification.recurringDays &&
                                                notification.recurringDays.length > 0 && (
                                                    <span className="inline-flex items-center gap-1 bg-gold-600/10 px-2.5 py-1 rounded-lg">
                                                        🔁{" "}
                                                        {notification.recurringDays
                                                            .map(
                                                                (d) =>
                                                                    DAY_NAMES.find((day) => day.id === d)?.label
                                                            )
                                                            .join(", ")}
                                                    </span>
                                                )}
                                            {notification.recurringTime && (
                                                <span className="inline-flex items-center gap-1 bg-gold-600/10 px-2.5 py-1 rounded-lg">
                                                    🕐 {notification.recurringTime}
                                                </span>
                                            )}
                                            <span className="inline-flex items-center gap-1 text-text-secondary/60">
                                                {new Date(notification.createdAt).toLocaleDateString(
                                                    "ar-EG"
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                        {notification.type !== "immediate" && (
                                            <button
                                                onClick={() => toggleActive(notification)}
                                                className={`p-2 rounded-lg transition-all cursor-pointer ${notification.active
                                                    ? "hover:bg-success/10 text-success"
                                                    : "hover:bg-gold-600/10 text-text-secondary"
                                                    }`}
                                                title={notification.active ? "تعطيل" : "تفعيل"}
                                            >
                                                {notification.active ? "✅" : "⏸️"}
                                            </button>
                                        )}

                                        {deleteConfirm === notification.id ? (
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleDelete(notification.id)}
                                                    className="px-2 py-1 text-xs bg-danger rounded-lg text-white hover:bg-danger-hover transition-all cursor-pointer"
                                                >
                                                    تأكيد
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(null)}
                                                    className="px-2 py-1 text-xs bg-bg-card-hover rounded-lg text-text-secondary hover:text-text-primary transition-all cursor-pointer"
                                                >
                                                    إلغاء
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setDeleteConfirm(notification.id)}
                                                className="p-2 rounded-lg hover:bg-danger/10 text-text-secondary hover:text-danger transition-all cursor-pointer"
                                                title="حذف"
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
