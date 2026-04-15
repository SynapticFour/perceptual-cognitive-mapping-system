type JsonObject = Record<string, unknown>;

function isPlainObject(v: unknown): v is JsonObject {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Deep-merge message trees; override leaves replace base. */
export function deepMergeMessages<T extends JsonObject>(base: T, override: JsonObject): T {
  const out: JsonObject = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const baseVal = out[key];
    if (isPlainObject(value) && isPlainObject(baseVal)) {
      out[key] = deepMergeMessages(baseVal, value);
    } else {
      out[key] = value;
    }
  }
  return out as T;
}
