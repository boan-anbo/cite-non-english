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
  const fail = (message: string): never => {
    throw new CneError("INVALID_INPUT", message, 400, { path });
  };
  if (
    !types.some(
      (type) =>
        type === actual || (type === "integer" && Number.isSafeInteger(value)),
    )
  )
    fail(`Expected ${types.join(" or ")}.`);
  if (schema.enum && !schema.enum.includes(value))
    fail("Value is not in the declared enum.");
  if (typeof value === "string") {
    if (
      value.length < (schema.minLength ?? 0) ||
      value.length > (schema.maxLength ?? Infinity) ||
      (schema.pattern && !new RegExp(schema.pattern).test(value))
    )
      fail("String does not meet the declared constraints.");
  }
  if (
    typeof value === "number" &&
    (!Number.isFinite(value) ||
      value < (schema.minimum ?? -Infinity) ||
      value > (schema.maximum ?? Infinity))
  )
    fail("Number is outside the declared bounds.");
  if (Array.isArray(value)) {
    if (
      value.length < (schema.minItems ?? 0) ||
      value.length > (schema.maxItems ?? Infinity)
    )
      fail("Array is outside the declared bounds.");
    value.forEach((entry, index) =>
      validate(schema.items!, entry, `${path}[${index}]`),
    );
  } else if (actual === "object") {
    const data = value as Record<string, unknown>;
    for (const key of schema.required ?? [])
      if (!Object.hasOwn(data, key)) fail(`Missing required property: ${key}.`);
    for (const key of Object.keys(data)) {
      if (!Object.hasOwn(schema.properties ?? {}, key))
        fail(`Unknown property: ${key}.`);
      validate(schema.properties![key], data[key], `${path}.${key}`);
    }
  }
}
