import { createHash, randomUUID } from "crypto";
import { getRedis } from "@/lib/market-api/core/redis";
import { resolveSearchParams } from "../search/params";

const CACHE_NAMESPACE = "market-api:v1:response-cache";
const SEARCH_CACHE_KIND = "search";
const GET_CACHE_KIND = "get";
const DEFAULT_TTL_MS = 5 * 60 * 1000;
const DEFAULT_MAX_BODY_BYTES = 512 * 1024;
const CACHE_LOCK_TTL_MS = 10_000;
const CACHE_WAIT_INTERVAL_MS = 50;
const RELEASE_LOCK_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
end
return 0
`;

type RedisClient = ReturnType<typeof getRedis>;
type CacheKind = typeof SEARCH_CACHE_KIND | typeof GET_CACHE_KIND;
type CacheStatus = "HIT" | "MISS" | "BYPASS";

type SerializedResponse = {
  body: string;
  status: number;
  statusText: string;
  headers: Array<[string, string]>;
};

function parsePositiveInt(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(Math.floor(parsed), 1);
}

function getCacheTtlSeconds(envKey: string, fallbackMs = DEFAULT_TTL_MS) {
  const ttlMs = parsePositiveInt(process.env[envKey], fallbackMs);
  return Math.max(1, Math.ceil(ttlMs / 1000));
}

function getMaxBodyBytes(envKey: string) {
  return parsePositiveInt(process.env[envKey], DEFAULT_MAX_BODY_BYTES);
}

function canonicalizeParams(params: URLSearchParams) {
  const entries = Array.from(params.entries());
  entries.sort((a, b) => {
    const keyDiff = a[0].localeCompare(b[0]);
    if (keyDiff !== 0) return keyDiff;
    return a[1].localeCompare(b[1]);
  });
  return entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
}

function buildCacheKey(scope: string, params: URLSearchParams) {
  const query = canonicalizeParams(params);
  return `${scope}?${query}`;
}

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function buildResponseCacheKey(kind: CacheKind, cacheKey: string) {
  return `${CACHE_NAMESPACE}:${kind}:response:${hash(cacheKey)}`;
}

function serializeHeaders(headers: Headers) {
  const serialized: Array<[string, string]> = [];
  headers.forEach((value, key) => {
    serialized.push([key, value]);
  });
  return serialized;
}

async function toSerializedResponse(response: Response): Promise<SerializedResponse> {
  return {
    body: await response.clone().text(),
    status: response.status,
    statusText: response.statusText,
    headers: serializeHeaders(response.headers)
  };
}

function toResponse(payload: SerializedResponse, cacheStatus: CacheStatus) {
  const headers = new Headers(payload.headers);
  headers.set("x-market-cache", cacheStatus);
  return new Response(payload.body, {
    status: payload.status,
    statusText: payload.statusText,
    headers
  });
}

function shouldCacheSerializedResponse(payload: SerializedResponse, maxBodyBytes: number) {
  if (payload.status !== 200) return false;
  const contentTypeHeader = payload.headers.find(([key]) => key.toLowerCase() === "content-type")?.[1] ?? "";
  if (!contentTypeHeader.toLowerCase().includes("application/json")) return false;
  if (Buffer.byteLength(payload.body, "utf8") > maxBodyBytes) return false;
  return true;
}

function buildCacheSafeRequest(request: Request, params: URLSearchParams) {
  const originalUrl = new URL(request.url);
  const query = canonicalizeParams(params);
  const url = query
    ? `${originalUrl.origin}${originalUrl.pathname}?${query}`
    : `${originalUrl.origin}${originalUrl.pathname}`;

  return new Request(url, {
    method: "GET",
    headers: new Headers(request.headers)
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readCachedResponse(redis: RedisClient, cacheKey: string) {
  const cached = await redis.get(cacheKey);
  return cached ? (JSON.parse(cached) as SerializedResponse) : null;
}

async function acquireCacheLock(redis: RedisClient, cacheKey: string) {
  const lockKey = `${cacheKey}:lock`;
  const token = randomUUID();
  const locked = await redis.set(lockKey, token, "PX", CACHE_LOCK_TTL_MS, "NX");
  return locked === "OK" ? { lockKey, token } : null;
}

async function releaseCacheLock(redis: RedisClient, lockKey: string, token: string) {
  await redis.eval(RELEASE_LOCK_SCRIPT, 1, lockKey, token);
}

async function waitForCachedResponse(redis: RedisClient, cacheKey: string, lockKey: string) {
  for (let waited = 0; waited < CACHE_LOCK_TTL_MS; waited += CACHE_WAIT_INTERVAL_MS) {
    await sleep(CACHE_WAIT_INTERVAL_MS);
    const cached = await readCachedResponse(redis, cacheKey);
    if (cached) return cached;
    if (!(await redis.exists(lockKey))) return null;
  }
  return null;
}

type ResponseCacheConfig = {
  scope: string;
  kind: CacheKind;
  ttlEnvKey: string;
  maxBodyBytesEnvKey: string;
};

async function withResponseCache(
  request: Request,
  config: ResponseCacheConfig,
  resolver: (cacheRequest: Request) => Promise<Response>
) {
  if (request.method.toUpperCase() !== "GET") return resolver(request);

  const redis = getRedis();
  const params = await resolveSearchParams(request);
  const rawCacheKey = buildCacheKey(config.scope, params);
  const cacheKey = buildResponseCacheKey(config.kind, rawCacheKey);
  const cached = await readCachedResponse(redis, cacheKey);
  if (cached) return toResponse(cached, "HIT");

  const lock = await acquireCacheLock(redis, cacheKey);
  if (!lock) {
    const waitedPayload = await waitForCachedResponse(redis, cacheKey, `${cacheKey}:lock`);
    if (waitedPayload) return toResponse(waitedPayload, "HIT");
  }

  try {
    const cacheSafeRequest = buildCacheSafeRequest(request, params);
    const serialized = await toSerializedResponse(await resolver(cacheSafeRequest));
    if (!shouldCacheSerializedResponse(serialized, getMaxBodyBytes(config.maxBodyBytesEnvKey))) {
      return toResponse(serialized, "BYPASS");
    }

    await redis.set(cacheKey, JSON.stringify(serialized), "EX", getCacheTtlSeconds(config.ttlEnvKey));
    return toResponse(serialized, "MISS");
  } finally {
    if (lock) await releaseCacheLock(redis, lock.lockKey, lock.token);
  }
}

export async function withSearchResponseCache(
  request: Request,
  scope: string,
  resolver: (cacheRequest: Request) => Promise<Response>
) {
  return withResponseCache(
    request,
    {
      scope,
      kind: SEARCH_CACHE_KIND,
      ttlEnvKey: "MARKET_SEARCH_CACHE_TTL_MS",
      maxBodyBytesEnvKey: "MARKET_SEARCH_CACHE_MAX_BODY_BYTES"
    },
    resolver
  );
}

export async function withGetResponseCache(
  request: Request,
  scope: string,
  resolver: (cacheRequest: Request) => Promise<Response>
) {
  return withResponseCache(
    request,
    {
      scope,
      kind: GET_CACHE_KIND,
      ttlEnvKey: "MARKET_GET_CACHE_TTL_MS",
      maxBodyBytesEnvKey: "MARKET_GET_CACHE_MAX_BODY_BYTES"
    },
    resolver
  );
}
