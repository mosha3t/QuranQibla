"use client";

import { useState, useEffect, useCallback } from "react";

interface Hadith {
    id: string;
    text: string;
    narrator: string;
    source: string;
    date: string;
    createdAt: string;
}

const EMPTY_FORM = { text: "", narrator: "", source: "", date: "" };

export default function HadithsPage() {
    const [hadiths, setHadiths] = useState<Hadith[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const fetchHadiths = useCallback(async () => {
        try {
            const res = await fetch("/api/hadiths");
            const data = await res.json();
            setHadiths(data);
        } catch (err) {
            console.error("Error fetching hadiths:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHadiths();
    }, [fetchHadiths]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const method = editingId ? "PUT" : "POST";
            const body = editingId ? { ...form, id: editingId } : form;

            await fetch("/api/hadiths", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            setShowModal(false);
            setForm(EMPTY_FORM);
            setEditingId(null);
            await fetchHadiths();
        } catch (err) {
            console.error("Error saving hadith:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (hadith: Hadith) => {
        setForm({
            text: hadith.text,
            narrator: hadith.narrator,
            source: hadith.source,
            date: hadith.date,
        });
        setEditingId(hadith.id);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await fetch(`/api/hadiths?id=${id}`, { method: "DELETE" });
            setDeleteConfirm(null);
            await fetchHadiths();
        } catch (err) {
            console.error("Error deleting hadith:", err);
        }
    };

    const openNew = () => {
        setForm({ ...EMPTY_FORM, date: new Date().toISOString().split("T")[0] });
        setEditingId(null);
        setShowModal(true);
    };

    const filtered = hadiths.filter(
        (h) =>
            h.text.includes(search) ||
            h.narrator.includes(search) ||
            h.source.includes(search)
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary">إدارة الأحاديث</h2>
                    <p className="text-sm text-text-secondary mt-1">
                        إضافة وتعديل وحذف الأحاديث اليومية
                    </p>
                </div>
                <button
                    onClick={openNew}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold-600 hover:bg-gold-500 text-bg-primary font-semibold rounded-xl transition-all duration-200 text-sm cursor-pointer"
                >
                    <span className="text-lg">+</span>
                    إضافة حديث
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="ابحث عن حديث..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-4 py-3 pr-11 bg-bg-card border border-border-default rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:border-gold-600 focus:ring-1 focus:ring-gold-600 transition-all text-right"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary/50">
                    🔍
                </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: "إجمالي الأحاديث", value: hadiths.length, icon: "📖" },
                    {
                        label: "أحاديث هذا الشهر",
                        value: hadiths.filter(
                            (h) =>
                                new Date(h.date).getMonth() === new Date().getMonth() &&
                                new Date(h.date).getFullYear() === new Date().getFullYear()
                        ).length,
                        icon: "📅",
                    },
                    {
                        label: "أحاديث اليوم",
                        value: hadiths.filter(
                            (h) => h.date === new Date().toISOString().split("T")[0]
                        ).length,
                        icon: "✨",
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
                            <p className="text-2xl font-bold text-gold-500">{stat.value}</p>
                            <p className="text-xs text-text-secondary">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Hadiths List */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-2 border-gold-600/30 border-t-gold-600 rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                    <span className="text-5xl block mb-4">📖</span>
                    <p className="text-text-secondary text-lg">
                        {search ? "لا توجد نتائج" : "لا توجد أحاديث بعد"}
                    </p>
                    {!search && (
                        <button
                            onClick={openNew}
                            className="mt-4 text-gold-500 hover:text-gold-400 text-sm underline cursor-pointer"
                        >
                            أضف أول حديث
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((hadith, i) => (
                        <div
                            key={hadith.id}
                            className="bg-bg-card border border-border-default rounded-xl p-5 hover:border-border-gold transition-all duration-200 animate-slide-up"
                            style={{ animationDelay: `${i * 50}ms` }}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="text-text-primary leading-relaxed text-sm mb-3">
                                        {hadith.text}
                                    </p>
                                    <div className="flex flex-wrap gap-3 text-xs text-text-secondary">
                                        <span className="inline-flex items-center gap-1 bg-gold-600/10 px-2.5 py-1 rounded-lg">
                                            📜 {hadith.narrator}
                                        </span>
                                        <span className="inline-flex items-center gap-1 bg-gold-600/10 px-2.5 py-1 rounded-lg">
                                            📚 {hadith.source}
                                        </span>
                                        <span className="inline-flex items-center gap-1 bg-gold-600/10 px-2.5 py-1 rounded-lg">
                                            📅 {hadith.date}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => handleEdit(hadith)}
                                        className="p-2 rounded-lg hover:bg-gold-600/10 text-text-secondary hover:text-gold-500 transition-all cursor-pointer"
                                        title="تعديل"
                                    >
                                        ✏️
                                    </button>

                                    {deleteConfirm === hadith.id ? (
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleDelete(hadith.id)}
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
                                            onClick={() => setDeleteConfirm(hadith.id)}
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowModal(false)}
                    />
                    <div className="relative w-full max-w-lg bg-bg-card border border-border-default rounded-2xl p-6 shadow-2xl animate-slide-up">
                        <h3 className="text-lg font-bold text-text-primary mb-6">
                            {editingId ? "تعديل الحديث" : "إضافة حديث جديد"}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-text-secondary mb-1.5">
                                    نص الحديث
                                </label>
                                <textarea
                                    value={form.text}
                                    onChange={(e) => setForm({ ...form, text: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-bg-input border border-border-default rounded-xl text-text-primary placeholder:text-text-secondary/50 text-right resize-none focus:border-gold-600 focus:ring-1 focus:ring-gold-600 transition-all"
                                    placeholder="أدخل نص الحديث..."
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-text-secondary mb-1.5">
                                        الراوي
                                    </label>
                                    <input
                                        type="text"
                                        value={form.narrator}
                                        onChange={(e) =>
                                            setForm({ ...form, narrator: e.target.value })
                                        }
                                        className="w-full px-4 py-3 bg-bg-input border border-border-default rounded-xl text-text-primary placeholder:text-text-secondary/50 text-right focus:border-gold-600 focus:ring-1 focus:ring-gold-600 transition-all"
                                        placeholder="مثال: أبو هريرة"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-text-secondary mb-1.5">
                                        المصدر
                                    </label>
                                    <input
                                        type="text"
                                        value={form.source}
                                        onChange={(e) =>
                                            setForm({ ...form, source: e.target.value })
                                        }
                                        className="w-full px-4 py-3 bg-bg-input border border-border-default rounded-xl text-text-primary placeholder:text-text-secondary/50 text-right focus:border-gold-600 focus:ring-1 focus:ring-gold-600 transition-all"
                                        placeholder="مثال: صحيح البخاري"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-text-secondary mb-1.5">
                                    تاريخ العرض
                                </label>
                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                                    className="w-full px-4 py-3 bg-bg-input border border-border-default rounded-xl text-text-primary focus:border-gold-600 focus:ring-1 focus:ring-gold-600 transition-all"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 py-3 bg-gold-600 hover:bg-gold-500 text-bg-primary font-semibold rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    {saving
                                        ? "جاري الحفظ..."
                                        : editingId
                                            ? "حفظ التعديلات"
                                            : "إضافة"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-3 bg-bg-card-hover text-text-secondary rounded-xl hover:text-text-primary transition-all cursor-pointer"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
