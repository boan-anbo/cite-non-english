/**
 * Language code mappings for CNE (Cite Non-English)
 * Maps ISO language codes to native and English names
 *
 * Format: "code": [nativeName, englishName]
 */

/**
 * Complete language name mapping
 * Source: Zotero language list
 */
export const LANGUAGE_NAMES: Record<string, [string, string]> = {
  "af-ZA": ["Afrikaans", "Afrikaans"],
  ar: ["العربية", "Arabic"],
  "bal-PK": ["بلوچی (پاکستان)", "Balochi (Pakistan)"],
  "bg-BG": ["Български", "Bulgarian"],
  "brh-PK": ["براہوئی", "Brahui"],
  "ca-AD": ["Català", "Catalan"],
  "cs-CZ": ["Čeština", "Czech"],
  "cy-GB": ["Cymraeg", "Welsh"],
  "da-DK": ["Dansk", "Danish"],
  "de-AT": ["Deutsch (Österreich)", "German (Austria)"],
  "de-CH": ["Deutsch (Schweiz)", "German (Switzerland)"],
  "de-DE": ["Deutsch (Deutschland)", "German (Germany)"],
  "el-GR": ["Ελληνικά", "Greek"],
  "en-GB": ["English (UK)", "English (UK)"],
  "en-US": ["English (US)", "English (US)"],
  "es-CL": ["Español (Chile)", "Spanish (Chile)"],
  "es-ES": ["Español (España)", "Spanish (Spain)"],
  "es-MX": ["Español (México)", "Spanish (Mexico)"],
  "et-EE": ["Eesti keel", "Estonian"],
  eu: ["Euskara", "Basque"],
  "fa-IR": ["فارسی", "Persian"],
  "fi-FI": ["Suomi", "Finnish"],
  "fr-CA": ["Français (Canada)", "French (Canada)"],
  "fr-FR": ["Français (France)", "French (France)"],
  "gl-ES": ["Galego (Spain)", "Galician (Spain)"],
  "he-IL": ["עברית", "Hebrew"],
  "hi-IN": ["हिंदी", "Hindi"],
  "hr-HR": ["Hrvatski", "Croatian"],
  "hu-HU": ["Magyar", "Hungarian"],
  "id-ID": ["Bahasa Indonesia", "Indonesian"],
  "is-IS": ["Íslenska", "Icelandic"],
  "it-IT": ["Italiano", "Italian"],
  "ja-JP": ["日本語", "Japanese"],
  "km-KH": ["ភាសាខ្មែរ", "Khmer"],
  "ko-KR": ["한국어", "Korean"],
  la: ["Latina", "Latin"],
  "lij-IT": ["Lìgure", "Ligurian"],
  "lt-LT": ["Lietuvių kalba", "Lithuanian"],
  "lv-LV": ["Latviešu", "Latvian"],
  "mn-MN": ["Монгол", "Mongolian"],
  "ms-MY": ["Bahasa Melayu", "Malay"],
  "nb-NO": ["Norsk bokmål", "Norwegian (Bokmål)"],
  "nl-NL": ["Nederlands", "Dutch"],
  "nn-NO": ["Norsk nynorsk", "Norwegian (Nynorsk)"],
  "pa-PK": ["پنجابی (شاہ‌مکھی)", "Punjabi (Shahmukhi)"],
  "pl-PL": ["Polski", "Polish"],
  "pt-BR": ["Português (Brasil)", "Portuguese (Brazil)"],
  "pt-PT": ["Português (Portugal)", "Portuguese (Portugal)"],
  "ro-RO": ["Română", "Romanian"],
  "ru-RU": ["Русский", "Russian"],
  "sk-SK": ["Slovenčina", "Slovak"],
  "sl-SI": ["Slovenščina", "Slovenian"],
  "sr-RS": ["Српски / Srpski", "Serbian"],
  "sv-SE": ["Svenska", "Swedish"],
  "th-TH": ["ไทย", "Thai"],
  "tr-TR": ["Türkçe", "Turkish"],
  "uk-UA": ["Українська", "Ukrainian"],
  "vi-VN": ["Tiếng Việt", "Vietnamese"],
  "zh-CN": ["简体中文", "Chinese (Simplified)"],
  "zh-TW": ["繁體中文", "Chinese (Traditional)"],
};

/**
 * Get language names by code
 *
 * @param code - ISO language code (e.g., "ja-JP", "zh-CN")
 * @returns Tuple of [nativeName, englishName] or null if not found
 */
export function getLanguageName(
  code: string,
): [string, string] | null {
  return LANGUAGE_NAMES[code] || null;
}

/**
 * Check if a language code is in the known list
 *
 * @param code - ISO language code to check
 * @returns true if the code is recognized
 */
export function isKnownLanguage(code: string): boolean {
  if (!code) {
    return false;
  }
  if (code in LANGUAGE_NAMES) {
    return true;
  }
  const normalized = code.toLowerCase();
  const base = normalized.split("-")[0];
  if (!base) {
    return false;
  }
  return Object.keys(LANGUAGE_NAMES).some((existing) =>
    existing.toLowerCase().startsWith(`${base}-`),
  );
}

/**
 * Get all language codes
 *
 * @returns Array of all language codes
 */
export function getAllLanguageCodes(): string[] {
  return Object.keys(LANGUAGE_NAMES);
}

/**
 * Format language display text for dropdown options
 *
 * @param code - ISO language code
 * @returns Formatted string "code - Native Name (English Name)"
 * @example formatLanguageOption("ja-JP") => "ja-JP - 日本語 (Japanese)"
 */
export function formatLanguageOption(code: string): string {
  const names = getLanguageName(code);
  if (!names) {
    return `Unknown: ${code}`;
  }
  const [native, english] = names;
  return `${code} - ${native} (${english})`;
}
