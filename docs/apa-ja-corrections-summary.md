# APA-JA Style Corrections Summary

## Updates Based on Real Japanese APA Examples

This document summarizes the corrections made to the apa-ja.csl style based on actual Japanese APA citation examples provided by the user.

---

## Key Corrections

### 1. Quotation Mark Usage ✅

**Original (Incorrect)**:
- All titles used 「」 (single quotation marks)
- No distinction between books and articles

**Corrected**:
- **Books**: Use 『』 (double quotation marks)
- **Articles/Papers**: Use 「」 (single quotation marks)
- **Journal/Magazine Names**: Use 『』 (double quotation marks)

**Examples**:

| Item Type | Title Format |
|-----------|--------------|
| Book | 『Kaggleで勝つデータ分析の技術』 |
| Journal Article | 「ソーシャルメディアを用いた...分析」 |
| Journal Name | 『人工知能学会論文誌』 |
| Webpage | 「機械学習」 |

---

### 2. Author Separator ✅

**Original (Incorrect)**:
- Used `・` (middle dot)

**Corrected**:
- Use `, ` (comma + space)

**Example**:
```
Before: 鳥海 不二夫・榊 剛史・吉田 光男
After:  鳥海 不二夫, 榊 剛史, 吉田 光男
```

---

### 3. Locale Terms ✅

**Original (Incorrect)**:
- Custom locale definitions that might conflict with official CSL ja-JP locale

**Corrected**:
- Rely on official CSL ja-JP locale from: https://github.com/citation-style-language/locales
- Only override terms when absolutely necessary for APA-specific formatting

**Official ja-JP Terms**:
- et-al: ほか
- no date: 日付なし
- editor: 編
- volume: 巻
- issue: 号
- page: ページ

---

### 4. Volume and Issue Format ✅

**Corrected**:
- Volume: `35巻` (number + 巻)
- Issue: `3号` (number + 号)
- Format: `35巻, 3号`

---

## Real Example Comparisons

### Journal Article

**Expected Output** (from user's example):
```
鳥海 不二夫, 榊 剛史, 吉田 光男（2020）. 「ソーシャルメディアを用いた新型コロナ禍における感情変化の分析」『人工知能学会論文誌』35巻, 3号, pp.1-7.
```

**Key Features**:
- Authors: comma-separated
- Year: full-width parentheses （2020）
- Article title: 「」
- Journal name: 『』
- Volume: 35巻
- Issue: 3号
- Pages: pp.1-7

---

### Book

**Expected Output** (from user's example):
```
門脇大輔, 阪田隆司, 保坂桂佑, 平松雄司（2019）. 『Kaggleで勝つデータ分析の技術』. 技術評論社.
```

**Key Features**:
- Authors: comma-separated
- Year: full-width parentheses （2019）
- Book title: 『』 (double quotation marks)
- Publisher: 技術評論社

---

### Website

**Expected Output** (from user's example):
```
野村総合研究所（2020）. 「機械学習」. https://www.nri.com/jp/knowledge/glossary/lst/ka/machine_learning, （参照 2023-04-01）
```

**Key Features**:
- Author: organizational name
- Year: full-width parentheses
- Page title: 「」 (single quotation marks)
- Accessed term: 参照
- Date format: YYYY-MM-DD

---

## Technical Changes

### Modified Macros

1. **`booklike-title`**:
   ```xml
   <!-- Changed from -->
   <text variable="title" prefix="「" suffix="」"/>

   <!-- To -->
   <text variable="title" prefix="『" suffix="』"/>
   ```

2. **`periodical-title`**:
   ```xml
   <!-- Keeps single quotation marks -->
   <text macro="title-plus-part-title" prefix="「" suffix="」"/>
   ```

3. **`container-periodical`**:
   ```xml
   <!-- Journal names use double quotation marks -->
   <text variable="container-title" prefix="『" suffix="』"/>
   ```

4. **`reviewed-title`**:
   ```xml
   <!-- Reviewed books also use double quotation marks -->
   <text variable="reviewed-title" prefix="『" suffix="』"/>
   ```

---

## Testing

### Test File
`/Users/boan/script/cite-non-english/test/csl-tests/test-apa-ja.ts`

### Test Cases

1. ✅ Journal article with correct quotation marks
2. ✅ Book with double quotation marks
3. ✅ Website with single quotation marks
4. ✅ Book with editor
5. ✅ No date handling
6. ✅ Multiple author formatting

---

## Reference Documents

The corrections were based on real Japanese APA examples from:
- Japanese academic style guide: APAスタイル参考文献の付け方
- Official CSL ja-JP locale: https://github.com/citation-style-language/locales/blob/master/locales-ja-JP.xml
- Japanese citation standards:
  - SIST 02:2007「参照文献の書き方」
  - JIS X 0807:1999「電子文献の引用法」

---

## Summary of Changes

| Aspect | Original | Corrected |
|--------|----------|-----------|
| Book titles | 「」 | 『』 |
| Article titles | 「」 | 「」 (kept) |
| Journal names | 『』 | 『』 (kept) |
| Author separator | ・ | `, ` |
| Locale | Custom | Official ja-JP |
| Et al. term | 他 | ほか |

---

**Last Updated**: 2025-10-15
**Version**: 1.1 (Corrected)
**Based On**: Real Japanese APA examples and official CSL ja-JP locale
