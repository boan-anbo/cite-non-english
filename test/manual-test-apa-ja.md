# Manual Testing Guide for APA-JA Style

## Test Status

**Note**: Automated tests could not be completed due to citeproc-js-server configuration issues in the current environment. However, the style file has been properly created and validated.

## Style File Validation

✅ **XML Syntax**: Validated with xmllint - No errors
✅ **File Location**: `/Users/boan/script/cite-non-english/tools/citeproc-js-server/csl/apa-ja.csl`
✅ **Default Locale**: Set to `ja`
✅ **CSL Version**: 1.0
✅ **Quotation Marks**: Properly configured

## Manual Testing Steps

### Using Zotero

1. **Install the Style**:
   ```bash
   cp tools/citeproc-js-server/csl/apa-ja.csl ~/Zotero/styles/
   ```

2. **Create Test Items** with these exact values:

#### Test 1: Journal Article
- Type: Journal Article
- Title: ソーシャルメディアを用いた新型コロナ禍における感情変化の分析
- Authors: 鳥海 不二夫, 榊 剛史, 吉田 光男
- Journal: 人工知能学会論文誌
- Volume: 35
- Issue: 3
- Pages: 1-7
- Year: 2020
- Language: ja

**Expected Output**:
```
鳥海 不二夫, 榊 剛史, 吉田 光男（2020）. 「ソーシャルメディアを用いた新型コロナ禍における感情変化の分析」『人工知能学会論文誌』35巻, 3号, pp.1-7.
```

**Checklist**:
- [ ] Article title uses 「」
- [ ] Journal name uses 『』
- [ ] Authors separated by `, `
- [ ] Year in （）
- [ ] Volume: 35巻
- [ ] Issue: 3号

#### Test 2: Book
- Type: Book
- Title: Kaggleで勝つデータ分析の技術
- Authors: 門脇大輔, 阪田隆司, 保坂桂佑, 平松雄司
- Publisher: 技術評論社
- Year: 2019
- Language: ja

**Expected Output**:
```
門脇大輔, 阪田隆司, 保坂桂佑, 平松雄司（2019）. 『Kaggleで勝つデータ分析の技術』. 技術評論社.
```

**Checklist**:
- [ ] Book title uses 『』
- [ ] No italic formatting
- [ ] Authors separated by `, `
- [ ] Year in （）

#### Test 3: Website
- Type: Webpage
- Title: 機械学習
- Author: 野村総合研究所
- URL: https://www.nri.com/jp/knowledge/glossary/lst/ka/machine_learning
- Year: 2020
- Accessed: 2023-04-01
- Language: ja

**Expected Output**:
```
野村総合研究所（2020）. 「機械学習」. https://www.nri.com/jp/knowledge/glossary/lst/ka/machine_learning, （参照 2023-04-01）
```

**Checklist**:
- [ ] Page title uses 「」
- [ ] URL included
- [ ] Accessed term: 参照

#### Test 4: Book with Editor (Original Example)
- Type: Book
- Title: 中國行政區劃通史. 十六国北朝卷
- Authors: 牟發松, 丹有江, 魏俊傑
- Editor: 周振鶴
- Series: 中國行政區劃通史
- Edition: 1
- Language: ja
- (No publication date)

**Expected Output**:
```
牟發松, 丹有江, 魏俊傑(日付なし).『中國行政區劃通史. 十六国北朝卷』(周振鶴,編; 1版)
```

**Checklist**:
- [ ] Book title uses 『』
- [ ] No date: 日付なし
- [ ] Editor: 編
- [ ] Edition: 1版

## Troubleshooting

### If quotation marks don't appear:
1. Check that Language field is set to `ja` or `jp-JP`
2. Restart Zotero
3. Switch style away and back to APA (ja)

### If authors use `&` instead of `, `:
- Ensure Language field is set to `ja`
- The official ja-JP locale uses "と" for "and", but the style should use comma separators in author lists

### If Japanese terms don't appear:
- Verify Language field is `ja`
- Check that style file is properly installed

## Validation Checklist

After testing all 4 examples above, verify:

- [ ] All book titles use 『』 (double quotation marks)
- [ ] All article/webpage titles use 「」 (single quotation marks)
- [ ] Journal/magazine names use 『』
- [ ] No italic formatting anywhere
- [ ] Authors separated by `, ` not `&` or `・`
- [ ] Japanese terms appear (日付なし, 編, 版, 巻, 号, 参照)
- [ ] Year in full-width parentheses （）

## Known Limitations

1. Page numbers may still show as "pp." in some cases (as per actual Japanese APA examples)
2. Depends on official CSL ja-JP locale being installed with your citation processor

## Files to Review

- Main style: `tools/citeproc-js-server/csl/apa-ja.csl`
- Test file: `test/csl-tests/test-apa-ja.ts`
- Documentation: `docs/apa-ja-corrections-summary.md`

---

**Created**: 2025-10-15
**Status**: Requires manual validation in working Zotero environment
