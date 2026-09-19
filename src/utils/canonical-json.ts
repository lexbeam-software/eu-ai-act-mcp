import { createHash } from "node:crypto";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

function assertWellFormedUnicode(value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        throw new TypeError("RFC 8785 input contains an unpaired high surrogate");
      }
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      throw new TypeError("RFC 8785 input contains an unpaired low surrogate");
    }
  }
}

function serializePrimitive(value: JsonValue): string {
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new TypeError("RFC 8785 input contains a non-finite number");
  }
  if (typeof value === "string") assertWellFormedUnicode(value);
  const serialized = JSON.stringify(value);
  if (serialized === undefined) throw new TypeError("Value is not valid JSON");
  return serialized;
}

export function canonicalize(value: JsonValue): string {
  const active = new WeakSet<object>();

  const visit = (current: JsonValue): string => {
    if (current === null || typeof current !== "object") {
      return serializePrimitive(current);
    }
    if (active.has(current)) throw new TypeError("RFC 8785 input contains a cycle");
    active.add(current);
    try {
      if (Array.isArray(current)) {
        return `[${current.map((item) => visit(item)).join(",")}]`;
      }
      const prototype = Object.getPrototypeOf(current);
      if (prototype !== Object.prototype && prototype !== null) {
        throw new TypeError("RFC 8785 input must contain plain JSON objects only");
      }
      const keys = Object.keys(current).sort();
      return `{${keys
        .map((key) => {
          assertWellFormedUnicode(key);
          return `${JSON.stringify(key)}:${visit(current[key]!)}`;
        })
        .join(",")}}`;
    } finally {
      active.delete(current);
    }
  };

  return visit(value);
}

export function compareUnicodeCodePoints(left: string, right: string): number {
  const leftPoints = Array.from(left, (character) => character.codePointAt(0)!);
  const rightPoints = Array.from(right, (character) => character.codePointAt(0)!);
  const length = Math.min(leftPoints.length, rightPoints.length);
  for (let index = 0; index < length; index += 1) {
    const difference = leftPoints[index]! - rightPoints[index]!;
    if (difference !== 0) return difference;
  }
  return leftPoints.length - rightPoints.length;
}

export function canonicalSha256(value: JsonValue): string {
  return createHash("sha256").update(canonicalize(value), "utf8").digest("hex");
}

/**
 * The part of a response that a pinned hash speaks for. Runtime metadata varies per call.
 * `server_version` varies per release and says nothing about the assessment: while it was
 * hashed, every version bump moved all twelve golden hashes and the evaluation baseline
 * without a single result changing. The version is still asserted, by the version-identity
 * gate and by the behavior suite, just not through the hash.
 */
export function deterministicResponseProjection<
  T extends { runtime_metadata?: unknown; server_version?: unknown },
>(response: T): Omit<T, "runtime_metadata" | "server_version"> {
  const { runtime_metadata: _runtimeMetadata, server_version: _serverVersion, ...stable } = response;
  return stable;
}

export function canonicalResponseHash<
  T extends { runtime_metadata?: unknown; server_version?: unknown },
>(response: T): string {
  return canonicalSha256(
    deterministicResponseProjection(response) as unknown as JsonValue,
  );
}
