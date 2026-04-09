import { sendNewsletterToAllUsers } from "./newsletter.service";
import cron, { type ScheduledTask } from "node-cron";

let task: ScheduledTask | null = null;

const parseNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const runDispatch = async () => {
  const enabled = (process.env.NEWSLETTER_AUTO_ENABLED || "true").toLowerCase() === "true";
  if (!enabled) {
    return;
  }

  try {
    const limit = parseNumber(process.env.NEWSLETTER_MAX_USERS_PER_RUN, 200);
    const result = await sendNewsletterToAllUsers(limit);
    console.log("[newsletter] weekly digest completed", result);
  } catch (error) {
    console.error("[newsletter] weekly digest failed", error);
  }
};

export const runNewsletterDispatchNow = async (limit?: number) => {
  const envLimit = parseNumber(process.env.NEWSLETTER_MAX_USERS_PER_RUN, 200);
  const safeLimit =
    typeof limit === "number" && Number.isFinite(limit) && limit > 0
      ? Math.min(limit, 1000)
      : envLimit;

  const result = await sendNewsletterToAllUsers(safeLimit);
  console.log("[newsletter] manual dispatch completed", result);
  return result;
};

export const startNewsletterScheduler = () => {
  if (task) {
    return;
  }

  // Default: every Monday at 09:00 server local time.
  const schedule = process.env.NEWSLETTER_CRON || "0 9 * * 1";
  const timezone = process.env.NEWSLETTER_TIMEZONE;

  if (!cron.validate(schedule)) {
    console.error(`[newsletter] invalid NEWSLETTER_CRON: ${schedule}`);
    return;
  }

  task = cron.schedule(
    schedule,
    () => {
      void runDispatch();
    },
    timezone ? { timezone } : undefined
  );

  // Optional immediate run on server boot for quick validation.
  if ((process.env.NEWSLETTER_RUN_ON_BOOT || "false").toLowerCase() === "true") {
    void runDispatch();
  }

  console.log(
    `[newsletter] scheduler started with cron "${schedule}"${timezone ? ` (${timezone})` : ""}`
  );
};
