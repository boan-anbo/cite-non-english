# APA日本語版 使用ガイド / APA-JA Usage Guide

## クイックスタート / Quick Start

### Zoteroでの使用方法

1. **スタイルファイルをZoteroにインストール**:
   ```bash
   cp tools/citeproc-js-server/csl/apa-ja.csl ~/Zotero/styles/
   ```

   または、Zotero内で:
   - Preferences > Cite > Styles > "+"ボタン
   - `apa-ja.csl`ファイルを選択

2. **引用スタイルを選択**:
   - 文書エディタで "American Psychological Association 7th edition (日本語)" を選択

### 書誌情報の入力

#### 重要なフィールド:

- **Language**: `jp-JP` または `ja` に設定（日本語の術語を使用するため）
- **Title**: 通常通り書籍名・論文名を入力
- **Author**: 姓・名を入力
- **Editor**: シリーズ編集者など

## 出力例 / Output Examples

### 書籍 (Book)

**Zotero入力**:
- Type: Book
- Title: 中國行政區劃通史. 十六国北朝卷
- Author: 牟發松, 丹有江, 魏俊傑
- Editor: 周振鶴
- Series: 中國行政區劃通史
- Edition: 1
- Language: jp-JP

**出力**:
```
牟發松, 丹有江, 魏俊傑(日付なし).『中國行政區劃通史. 十六国北朝卷』(周振鶴,編; 1版)
```

### 学術論文 (Journal Article)

**Zotero入力**:
- Type: Journal Article
- Title: 認知科学における引用スタイルの研究
- Author: 田中太郎, 佐藤花子
- Publication: 認知科学
- Volume: 25
- Issue: 3
- Pages: 45-67
- Date: 2024
- Language: jp-JP

**期待される出力**:
```
田中太郎, 佐藤花子(2024).「認知科学における引用スタイルの研究」『認知科学』25巻, 3号, pp.45-67
```

### 書籍の章 (Book Chapter)

**Zotero入力**:
- Type: Book Section
- Title: 第五章：方法論
- Author: 山田一郎
- Editor: 鈴木二郎
- Book Title: 研究手法の理論と実践
- Pages: 89-112
- Publisher: 学術出版
- Date: 2023
- Language: jp-JP

**期待される出力**:
```
山田一郎.(2023).「第五章：方法論」鈴木二郎(編)『研究手法の理論と実践』(89-112頁). 学術出版
```

## スタイルの特徴 / Style Features

### 📖 書名号の使用

| 用途 | 記号 | 例 |
|------|------|-----|
| 論文・記事タイトル | 「」(単引用符) | 「認知科学の研究」 |
| 書籍名 | 『』(双引用符) | 『データ分析の技術』 |
| 雑誌・期刊名 | 『』(双引用符) | 『認知科学』 |

### ✍️ イタリック体の不使用

- 英語版APAではイタリック体を使用
- 日本語版では書名号を使用し、イタリック体は使用しない

### 👥 著者名の区切り

- 2人以上の著者: コンマ+スペース（`, `）で区切る
  - 例: 田中太郎, 佐藤花子, 鈴木三郎

### 📅 日本語術語

- 日付なし: "n.d." の代わりに
- 編: "Ed." の代わりに
- 訳: "Trans." の代わりに
- 版: "ed." の代わりに
- 巻: "Vol." の代わりに
- 頁: "p./pp." の代わりに

## トラブルシューティング / Troubleshooting

### 日本語術語が表示されない

**問題**: 英語の術語（"n.d.", "Ed."など）が表示される

**解決策**:
1. Zoteroの項目の "Language" フィールドを確認
2. `ja` または `jp-JP` に設定されているか確認
3. 設定されていない場合は追加して更新

### 書名号が表示されない

**問題**: タイトルが「」で囲まれていない

**解決策**:
1. CSLファイルが正しくインストールされているか確認
2. Zoteroを再起動
3. スタイルを一度他のものに変更してから戻す

### 著者名の区切りが正しくない

**問題**: 著者名が "&" で区切られる

**解決策**:
1. Language フィールドを `ja` に設定
2. 日本語APAスタイルではコンマ+スペース（`, `）が使用されます

## 高度な設定 / Advanced Configuration

### カスタマイズ

CSLファイルを編集してカスタマイズできる項目:

1. **書名号の種類**:
   - 文章タイトル用:
   ```xml
   <term name="open-quote">「</term>
   <term name="close-quote">」</term>
   ```

3. **"他" の表記** (line 107):
   ```xml
   <term name="et-al">他</term>
   ```
   例: "ほか" に変更する場合 → `<term name="et-al">ほか</term>`

### Zotero以外での使用

#### Pandoc:
```bash
pandoc document.md --citeproc --csl=apa-ja.csl --bibliography=references.bib -o output.pdf
```

#### LaTeX with BibLaTeX:
CSLファイルを直接使用できませんが、同様の書式設定を実装できます。

## リソース / Resources

- APA公式サイト: https://apastyle.apa.org/
- CSL仕様: https://docs.citationstyles.org/
- Zotero Style Repository: https://www.zotero.org/styles
- 日本心理学会: https://psych.or.jp/ (日本語論文の引用規則)

## フィードバック / Feedback

問題やバグを発見した場合は、プロジェクトのIssuesに報告してください。

---

**最終更新**: 2025-10-15
**バージョン**: 1.0
**ベース**: APA 7th edition
