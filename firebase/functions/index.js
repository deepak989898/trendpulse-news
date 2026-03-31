const { onSchedule } = require("firebase-functions/v2/scheduler");

exports.trendPulseHourly = onSchedule(
  {
    schedule: "every 60 minutes",
    region: "asia-south1",
    secrets: ["TRENDPULSE_BASE_URL", "TRENDPULSE_CRON_SECRET"],
  },
  async () => {
    const baseUrl = process.env.TRENDPULSE_BASE_URL;
    const secret = process.env.TRENDPULSE_CRON_SECRET;
    if (!baseUrl || !secret) {
      console.error("Missing TRENDPULSE_BASE_URL or TRENDPULSE_CRON_SECRET");
      return;
    }

    await fetch(`${baseUrl}/api/automation/run`, {
      method: "POST",
      headers: {
        "x-cron-secret": secret,
      },
    });
  },
);
