"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
    { href: "/hadiths", label: "الأحاديث", icon: "📖" },
    { href: "/notifications", label: "الإشعارات", icon: "🔔" },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await fetch("/api/auth", { method: "DELETE" });
        router.push("/login");
    };

    return (
        <div className="min-h-screen bg-bg-primary flex">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 right-0 z-40 w-72 bg-bg-card border-l border-border-default flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
                    }`}
            >
                {/* Sidebar Header */}
                <div className="p-6 border-b border-border-default">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gold-600/10 border border-border-gold flex items-center justify-center">
                            <span className="text-xl">🕌</span>
                        </div>
                        <div>
                            <h2 className="font-bold text-text-primary text-sm">لوحة التحكم</h2>
                            <p className="text-xs text-text-secondary">تطبيق القرآن الكريم</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                        ? "bg-gold-600/15 text-gold-500 border border-border-gold"
                                        : "text-text-secondary hover:bg-bg-card-hover hover:text-text-primary"
                                    }`}
                            >
                                <span className="text-lg">{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-border-default">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-text-secondary hover:bg-danger/10 hover:text-danger transition-all duration-200 cursor-pointer"
                    >
                        <span className="text-lg">🚪</span>
                        تسجيل الخروج
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top Bar */}
                <header className="h-16 border-b border-border-default bg-bg-card/50 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20">
                    {/* Mobile hamburger */}
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 rounded-lg hover:bg-bg-card-hover transition-colors cursor-pointer"
                        aria-label="فتح القائمة"
                    >
                        <svg className="w-6 h-6 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    <h1 className="text-lg font-semibold text-text-primary">
                        {NAV_ITEMS.find((item) => pathname.startsWith(item.href))?.label || "لوحة التحكم"}
                    </h1>

                    <div className="hidden lg:block" />
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 lg:p-8 animate-fade-in">{children}</main>
            </div>
        </div>
    );
}
