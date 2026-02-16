export async function register() {
    // Only run the cron scheduler on the Node.js server runtime
    if (process.env.NEXT_RUNTIME === "nodejs") {
        console.log("[CRON] Instrumentation registered — starting cron scheduler");

        // Start the cron interval after a short delay to let the server boot
        setTimeout(() => {
            const INTERVAL_MS = 60_000; // every 60 seconds

            const runCron = async () => {
                try {
                    // Dynamic import to avoid loading at build time
                    const { processCronJobs } = await import("./lib/cron");
                    await processCronJobs();
                } catch (error) {
                    console.error("[CRON] Error in scheduled run:", error);
                }
            };

            // Run immediately on first tick, then every minute
            runCron();
            setInterval(runCron, INTERVAL_MS);

            console.log(
                `[CRON] Scheduler started — running every ${INTERVAL_MS / 1000}s`
            );
        }, 5000); // 5 second delay for server boot
    }
}
