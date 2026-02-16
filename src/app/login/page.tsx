"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            if (res.ok) {
                router.push("/hadiths");
            } else {
                const data = await res.json();
                setError(data.error || "خطأ في تسجيل الدخول");
            }
        } catch {
            setError("حدث خطأ في الاتصال");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-bg-primary relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gold-600/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gold-600/5 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-600/3 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md animate-slide-up relative z-10">
                {/* Logo / Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gold-600/10 border border-border-gold mb-4 animate-pulse-gold">
                        <span className="text-4xl">🕌</span>
                    </div>
                    <h1 className="text-3xl font-bold text-text-primary mb-2">لوحة التحكم</h1>
                    <p className="text-text-secondary text-sm">تطبيق القرآن الكريم — إدارة الأحاديث والإشعارات</p>
                </div>

                {/* Login Card */}
                <form
                    onSubmit={handleLogin}
                    className="bg-bg-card rounded-2xl p-8 border border-border-default shadow-2xl shadow-black/20"
                >
                    <div className="mb-6">
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-text-secondary mb-2"
                        >
                            كلمة المرور
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="أدخل كلمة المرور"
                            className="w-full px-4 py-3 bg-bg-input border border-border-default rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:border-gold-600 focus:ring-1 focus:ring-gold-600 transition-all duration-200 text-right"
                            required
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-xl text-center animate-fade-in">
                            <p className="text-danger text-sm">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-gold-600 hover:bg-gold-500 active:bg-gold-700 text-bg-primary font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {loading ? (
                            <span className="inline-flex items-center gap-2">
                                <svg
                                    className="animate-spin h-4 w-4"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                    />
                                </svg>
                                جاري الدخول...
                            </span>
                        ) : (
                            "دخول"
                        )}
                    </button>
                </form>

                <p className="text-center text-text-secondary/40 text-xs mt-6">
                    © {new Date().getFullYear()} لوحة تحكم تطبيق القرآن
                </p>
            </div>
        </div>
    );
}
