import { CneError } from "./errors";

/** The small JSON Schema subset used by our public contracts. No coercion. */
export interface Schema {
  type: string | string[];
  description?: string;
  enum?: readonly unknown[];
  properties?: Record<string, Schema>;
  required?: string[];
  additionalProperties?: false;
  items?: Schema;
  minItems?: number;
  maxItems?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minimum?: number;
  maximum?: number;
}

export const object = (
  properties: Record<string, Schema>,
  required = Object.keys(properties),
): Schema => ({
  type: "object",
  properties,
  required,
  additionalProperties: false,
});
export const string = (maxLength = 10000): Schema => ({
  type: "string",
  minLength: 1,
  maxLength,
});
export const integer = (
  minimum = 0,
  maximum = Number.MAX_SAFE_INTEGER,
): Schema => ({ type: "integer", minimum, maximum });
export const array = (items: Schema, maxItems = 50, minItems = 1): Schema => ({
  type: "array",
  items,
  minItems,
  maxItems,
});

export function validate(schema: Schema, value: unknown, path = "input"): void {
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  const actual =
    value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
  const fail = (
    message: string,
    details: Record<string, unknown> = {},
  ): never => {
    throw new CneError("INVALID_INPUT", message, 400, { path, ...details });
  };
  if (
    !types.some(
      (type) =>
        type === actual || (type === "integer" && Number.isSafeInteger(value)),
    )
  )
    fail(`Expected ${types.join(" or ")}; received ${actual}.`, {
      type: schema.type,
    });
  if (schema.enum && !schema.enum.includes(value))
    fail(
      `Expected one of: ${schema.enum.map((entry) => JSON.stringify(entry)).join(", ")}.`,
      {
        enum: schema.enum,
      },
    );
  if (typeof value === "string") {
    if (value.length < (schema.minLength ?? 0))
      fail(`Use at least ${schema.minLength} characters.`, {
        minLength: schema.minLength,
      });
    if (value.length > (schema.maxLength ?? Infinity))
      fail(`Use at most ${schema.maxLength} characters.`, {
        maxLength: schema.maxLength,
      });
    if (schema.pattern && !new RegExp(schema.pattern).test(value))
      fail(`Expected a string matching ${schema.pattern}.`, {
        pattern: schema.pattern,
      });
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail("Use a finite number.");
    if (value < (schema.minimum ?? -Infinity))
      fail(`Use a number greater than or equal to ${schema.minimum}.`, {
        minimum: schema.minimum,
      });
    if (value > (schema.maximum ?? Infinity))
      fail(`Use a number less than or equal to ${schema.maximum}.`, {
        maximum: schema.maximum,
      });
  }
  if (Array.isArray(value)) {
    if (value.length < (schema.minItems ?? 0))
      fail(`Include at least ${schema.minItems} entries.`, {
        minItems: schema.minItems,
      });
    if (value.length > (schema.maxItems ?? Infinity))
      fail(`Include at most ${schema.maxItems} entries.`, {
        maxItems: schema.maxItems,
      });
    value.forEach((entry, index) =>
      validate(schema.items!, entry, `${path}[${index}]`),
    );
  } else if (actual === "object") {
    const data = value as Record<string, unknown>;
    for (const key of schema.required ?? [])
      if (!Object.hasOwn(data, key))
        fail(`Missing required property: ${key}.`, { path: `${path}.${key}` });
    for (const key of Object.keys(data)) {
      if (!Object.hasOwn(schema.properties ?? {}, key))
        fail(
          `Unknown property: ${key}. Use the operation's input schema from discovery.`,
          { path: `${path}.${key}` },
        );
      validate(schema.properties![key], data[key], `${path}.${key}`);
    }
  }
}
