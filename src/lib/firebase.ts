import admin from "firebase-admin";
import fs from "fs";
import path from "path";

// Initialize Firebase Admin SDK
// Uses a service account JSON file specified via FIREBASE_SERVICE_ACCOUNT_PATH env var,
// or falls back to GOOGLE_APPLICATION_CREDENTIALS, or Application Default Credentials.
function getFirebaseApp(): admin.app.App {
    if (admin.apps.length > 0) {
        return admin.apps[0]!;
    }

    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    if (serviceAccountPath) {
        try {
            // Use process.cwd() to resolve relative paths correctly in Next.js
            const resolvedPath = path.resolve(process.cwd(), serviceAccountPath);
            const fileContent = fs.readFileSync(resolvedPath, "utf-8");
            const serviceAccount = JSON.parse(fileContent);

            return admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        } catch (error) {
            console.error("Error loading Firebase service account:", error);
            // Fallthrough to default credentials if file load fails
        }
    }

    // Fallback to Application Default Credentials
    return admin.initializeApp({
        credential: admin.credential.applicationDefault(),
    });
}

const DEFAULT_TOPIC = "all";

export interface FCMPayload {
    title: string;
    body: string;
}

/**
 * Send a notification to all users subscribed to the default topic.
 */
export async function sendNotificationToTopic(
    payload: FCMPayload,
    topic: string = DEFAULT_TOPIC
): Promise<string> {
    const app = getFirebaseApp();
    const messaging = admin.messaging(app);

    const message: admin.messaging.Message = {
        topic,
        notification: {
            title: payload.title,
            body: payload.body,
        },
        android: {
            priority: "high",
            notification: {
                sound: "default",
                channelId: "default",
            },
        },
        apns: {
            payload: {
                aps: {
                    sound: "default",
                    badge: 1,
                },
            },
        },
    };

    const response = await messaging.send(message);
    console.log(`[FCM] Notification sent to topic "${topic}":`, response);
    return response;
}
