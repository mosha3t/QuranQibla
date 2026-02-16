import { promises as fs } from "fs";
import path from "path";

export interface Hadith {
    id: string;
    text: string;
    narrator: string;
    source: string;
    date: string;
    createdAt: string;
}

export interface Notification {
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

const DATA_DIR = path.join(process.cwd(), "data");

async function ensureDataDir() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

async function readJSON<T>(filename: string): Promise<T[]> {
    await ensureDataDir();
    const filePath = path.join(DATA_DIR, filename);
    try {
        const data = await fs.readFile(filePath, "utf-8");
        return JSON.parse(data);
    } catch {
        return [];
    }
}

async function writeJSON<T>(filename: string, data: T[]): Promise<void> {
    await ensureDataDir();
    const filePath = path.join(DATA_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// Hadiths
export async function getHadiths(): Promise<Hadith[]> {
    return readJSON<Hadith>("hadiths.json");
}

export async function saveHadiths(hadiths: Hadith[]): Promise<void> {
    return writeJSON("hadiths.json", hadiths);
}

// Notifications
export async function getNotifications(): Promise<Notification[]> {
    return readJSON<Notification>("notifications.json");
}

export async function saveNotifications(notifications: Notification[]): Promise<void> {
    return writeJSON("notifications.json", notifications);
}
