import Redis from "ioredis";
import type { RedisOptions } from "ioredis";

let client: Redis | null = null;

function getRedisUrl(): string {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is required.");
  return url;
}

function parseRedisDb(pathname: string): number | undefined {
  const trimmed = pathname.replace(/^\/+/, "").trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function buildRedisOptions(url: string) {
  const parsed = new URL(url);
  const options: RedisOptions = {
    host: parsed.hostname,
    port: parsed.port ? Number.parseInt(parsed.port, 10) : 6379,
    username: parsed.username || undefined,
    password: parsed.password || undefined,
    db: parseRedisDb(parsed.pathname),
    maxRetriesPerRequest: 2,
    connectTimeout: 5_000,
    commandTimeout: 5_000,
    enableReadyCheck: true,
    enableOfflineQueue: true,
    retryStrategy: (times) => Math.min(times * 100, 2_000),
  };

  if (parsed.protocol === "rediss:") {
    return {
      ...options,
      tls: {},
    };
  }

  return options;
}

export function getRedis(): Redis {
  if (client?.status && client.status !== "end") return client;

  const redis = new Redis(buildRedisOptions(getRedisUrl()));
  client = redis;

  redis.on("connect", () => {
    redis.stream?.unref?.();
  });
  redis.on("error", (err) => {
    console.error("[redis] connection error:", err.message);
  });
  redis.on("end", () => {
    if (client === redis) client = null;
  });

  return redis;
}
