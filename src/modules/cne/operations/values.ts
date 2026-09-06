import { FIELD_VARIANTS, SUPPORTED_FIELDS } from "../constants";
import type { CneCreatorData, CneMetadataData } from "../types";
import { CneError } from "./errors";

export const CREATOR_FIELDS = {
  lastRomanized: "string",
  firstRomanized: "string",
  lastOriginal: "string",
  firstOriginal: "string",
  optionsOriginalSpacing: "boolean",
  optionsForceComma: "boolean",
} as const satisfies Record<keyof CneCreatorData, string>;

export const FIELD_PATHS = SUPPORTED_FIELDS.flatMap(({ name }) =>
  FIELD_VARIANTS.map((variant) => `${name}.${variant}`),
);
export type Value = string | boolean;
export type Values = Record<string, Value>;
export interface Change {
  path: string;
  value: Value | null;
}
export type PatchMode = "replace" | "fillMissing";

export function toValues(data: CneMetadataData, language = ""): Values {
  const values: Values = {};
  for (const { name } of SUPPORTED_FIELDS) {
    for (const variant of FIELD_VARIANTS) {
      const value = data[name]?.[variant]?.trim();
      if (value) values[`${name}.${variant}`] = value;
    }
  }
  if (data.originalLanguage?.trim())
    values.originalLanguage = data.originalLanguage.trim();
  if (language) values.language = language;
  data.authors?.forEach((creator, index) => {
    for (const key of Object.keys(CREATOR_FIELDS) as (keyof CneCreatorData)[]) {
      const value = creator?.[key];
      if (value !== undefined && value !== "") {
        values[`creators.${index}.${key}`] =
          typeof value === "string" ? value.trim() : value;
      }
    }
  });
  return values;
}

export function fromValues(values: Values): CneMetadataData {
  const data: CneMetadataData = {};
  for (const { name } of SUPPORTED_FIELDS) {
    for (const variant of FIELD_VARIANTS) {
      const value = values[`${name}.${variant}`];
      if (typeof value === "string" && value) {
        (data[name] ??= {})[variant] = value;
      }
    }
  }
  if (typeof values.originalLanguage === "string")
    data.originalLanguage = values.originalLanguage;
  for (const [path, value] of Object.entries(values)) {
    const match = /^creators\.(\d+)\.(\w+)$/.exec(path);
    if (!match) continue;
    const creator = ((data.authors ??= [])[Number(match[1])] ??= {});
    Object.assign(creator, { [match[2]]: value });
  }
  return data;
}

export function diffValues(before: Values, after: Values): Change[] {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((path) => before[path] !== after[path])
    .map((path) => ({ path, value: after[path] ?? null }));
}

export function validateChanges(
  changes: Change[],
  creatorCount: number,
): Change[] {
  const seen = new Set<string>();
  return changes.map(({ path, value }) => {
    const creator = /^creators\.(0|[1-9]\d*)\.(\w+)$/.exec(path);
    let type: string = "string";
    if (creator && Object.hasOwn(CREATOR_FIELDS, creator[2])) {
      if (Number(creator[1]) >= creatorCount && value !== null) {
        throw new CneError(
          "INVALID_CREATOR",
          "Creator index does not exist. Use the zero-based native.creators order across all roles.",
          400,
          { path, creatorCount },
        );
      }
      type = CREATOR_FIELDS[creator[2] as keyof CneCreatorData];
    } else if (
      ![...FIELD_PATHS, "originalLanguage", "language"].includes(path)
    ) {
      throw new CneError(
        "INVALID_FIELD",
        "Unknown CNE field. Use the fields from GET /cne/v1.",
        400,
        { path },
      );
    }
    if (seen.has(path))
      throw new CneError(
        "INVALID_PATCH",
        "Each path can occur only once.",
        400,
        { path },
      );
    seen.add(path);
    if (
      value !== null &&
      (typeof value !== type ||
        (typeof value === "string" &&
          (!value.trim() ||
            /[\r\n]/.test(value) ||
            value.includes(String.fromCharCode(0)) ||
            value.length > 10000)))
    ) {
      throw new CneError(
        "INVALID_VALUE",
        type === "boolean"
          ? "Use true or false, or null to clear."
          : "Use non-empty single-line text of at most 10000 characters without NUL characters, or null to clear.",
        400,
        { path, type },
      );
    }
    return { path, value: typeof value === "string" ? value.trim() : value };
  });
}

export function applyChanges(
  current: Values,
  changes: Change[],
  mode: PatchMode,
): Values {
  const next = { ...current };
  for (const { path, value } of changes) {
    if (mode === "fillMissing" && Object.hasOwn(next, path)) continue;
    if (value === null) delete next[path];
    else next[path] = value;
  }
  return next;
}
