import { createHash } from "node:crypto";

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

function normalize(value: unknown): JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("Cannot canonicalize non-finite number");
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalize(item));
  }

  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    return Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort()
      .reduce<Record<string, JsonValue>>((accumulator, key) => {
        accumulator[key] = normalize(record[key]);
        return accumulator;
      }, {});
  }

  throw new Error(`Cannot canonicalize ${typeof value}`);
}

export function canonicalizeJson(value: unknown): string {
  return JSON.stringify(normalize(value));
}

export function hashCanonicalJson(value: unknown): string {
  return `sha256:${createHash("sha256").update(canonicalizeJson(value)).digest("hex")}`;
}

export function manifestProofPayload<T>(manifest: T): T {
  const payload = JSON.parse(JSON.stringify(manifest)) as {
    storage?: { manifestRoot?: string };
  };
  if (payload.storage) {
    delete payload.storage.manifestRoot;
  }
  return payload as T;
}

export function hashManifestForProof(manifest: unknown): string {
  return hashCanonicalJson(manifestProofPayload(manifest));
}
