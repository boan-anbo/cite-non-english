# APA vs APA-JA Comparison

## Side-by-Side Formatting Comparison

### Book Citation

| Style | Output |
|-------|--------|
| **APA (English)** | Mou, F., Dan, Y., & Wei, J. (n.d.). *Zhongguo xingzheng quhua tongshi. Shiliu guo beichao juan* (Z. Zhou, Ed.; 1st ed.) |
| **APA-JA (Japanese)** | 牟發松, 丹有江, 魏俊傑(日付なし).『中國行政區劃通史. 十六国北朝卷』(周振鶴,編; 1版) |

**Key Differences:**
- ✅ Book title uses 『』 instead of *italic*
- ✅ Author separator: `, ` (comma+space) instead of `&`
- ✅ Japanese terms: 日付なし (n.d.), 編 (Ed.), 版 (ed.)

---

### Journal Article

| Style | Output |
|-------|--------|
| **APA (English)** | Tanaka, T., & Sato, H. (2024). A study on citation styles in cognitive science. *Cognitive Science*, *25*(3), 45-67. |
| **APA-JA (Japanese)** | 田中太郎, 佐藤花子(2024).「認知科学における引用スタイルの研究」『認知科学』25巻, 3号, pp.45-67 |

**Key Differences:**
- ✅ Article title uses 「」 (single quotation marks)
- ✅ Journal name uses 『』 (double quotation marks) instead of *italic*
- ✅ Volume/issue: 25巻, 3号 format
- ✅ Author separator: `, ` instead of ` & `

---

### Book Chapter

| Style | Output |
|-------|--------|
| **APA (English)** | Yamada, I. (2023). Chapter 5: Methodology. In S. Suzuki (Ed.), *Theory and practice of research methods* (pp. 89-112). Academic Press. |
| **APA-JA (Japanese)** | 山田一郎(2023).「第五章：方法論」鈴木二郎(編)『研究手法の理論と実践』(pp. 89-112). 学術出版 |

**Key Differences:**
- ✅ Chapter title: 「」 (single quotation marks)
- ✅ Book title: 『』 (double quotation marks) instead of *italic*
- ✅ Pages: pp. format maintained

---

## Detailed Feature Comparison

| Feature | APA (English) | APA-JA (Japanese) |
|---------|---------------|-------------------|
| **Title Format (Books)** | *Italic* | 『』double quotation marks |
| **Title Format (Articles)** | No special formatting | 「」single quotation marks |
| **Container Title (Journals)** | *Italic* | 『』double quotation marks |
| **Container Title (Books)** | *Italic* | 『』double quotation marks |
| **Author Separator** | & (ampersand) | , (comma + space) |
| **Et al.** | et al. | ほか |
| **No Date** | n.d. | 日付なし |
| **Editor** | Ed./Eds. | 編 |
| **Translator** | Trans. | 訳 |
| **Edition** | ed./1st ed. | 版/1版 |
| **Volume** | Vol. | 巻 |
| **Issue** | No. | 号 |
| **Page(s)** | p./pp. | pp. (kept as Western format) |
| **In** (for chapters) | In | に |

---

## Visual Formatting Comparison

### English APA Typography:
```
Smith, J., & Doe, A. (2024). The title of the article. 
Journal Name, 12(3), 45-67. https://doi.org/...
         ↑              ↑
    Ampersand       Italic
```

### Japanese APA Typography:
```
田中太郎, 佐藤花子(2024).「記事のタイトル」
『雑誌名』12巻, 3号, pp.45-67. https://doi.org/...
    ↑              ↑       ↑       ↑
  Comma     「」for     『』for   No italic
           articles   journals
```

---

## When to Use Each Style

### Use **APA (Standard)**:
- ✅ Writing in English
- ✅ International publications
- ✅ APA mandate from publisher
- ✅ Cross-lingual consistency needed

### Use **APA-JA (Japanese)**:
- ✅ Writing in Japanese
- ✅ Japanese-language publications
- ✅ Japanese academic institutions
- ✅ When Japanese typographic conventions are preferred
- ✅ When citing primarily Japanese sources

---

## Locale Settings Impact

The formatting automatically adapts based on the `language` field in your bibliography software:

| Language Field | Result |
|---------------|---------|
| `en` or `en-US` | English APA formatting |
| `ja` or `jp-JP` | Japanese APA formatting |

**Important**: Both styles are based on the same APA 7th edition structure, just with different typographic conventions for Japanese text.

---

## Technical Implementation

### English APA:
```xml
<text variable="title" font-style="italic"/>
<term name="and">&amp;</term>
<term name="no date">n.d.</term>
```

### Japanese APA:
```xml
<text variable="title" prefix="「" suffix="」"/>
<term name="and">・</term>
<term name="no date">日付なし</term>
```

---

*Last updated: 2025-10-15*
*Comparison based on APA 7th edition*
