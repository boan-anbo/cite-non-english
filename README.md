# Cite Non-English (CNE)

[![zotero target version](https://img.shields.io/badge/Zotero-7-green?style=flat-square&logo=zotero&logoColor=CC2936)](https://www.zotero.org)
[![Using Zotero Plugin Template](https://img.shields.io/badge/Using-Zotero%20Plugin%20Template-blue?style=flat-square&logo=github)](https://github.com/windingwind/zotero-plugin-template)

Cite Non-English (CNE) is a Zotero extension that provides robust support for non-English citations.

---

## I. Core Concepts

### CNE Demo

https://github.com/user-attachments/assets/50c3e7eb-a79a-41bb-8eb6-774a9f80b3a6

### Overview

CNE enables you to manage metadata for non-English sources and output correctly formatted citations—all inside Zotero. It bundles the moving parts into a coherent extension with a stable API, so you can rely on a single tool that continues to work even as Zotero evolves.

Under the hood CNE does the hard work of coordinating Zotero internals, citation styles, citeproc engines, and export workflows so you can simply cite your sources without worrying about the details. The project is committed to maintaining that experience until native non-English citation support is built into Zotero.

### Rationale

English-language citation guides (especially in the humanities and social sciences) often require both transliteration/romanization and the original script when citing non-English materials. For example, consider the same sources rendered by Zotero alone versus Zotero with the CNE version of Chicago 18th Notes & Bibliography:

#### Zotero native Chicago style

- 华林甫. “清代以来三峡地区水旱灾害的初步研究.” 中国社会科学 1 (1999): 168–79.
- 姜友邦. 圓融과調和: 韓國古代彫刻史의原理. Yŏrhwadang, 1990.
- 阿部善雄, and 金子英生. 最後の「日本人」: 朝河貫一の生涯. 岩波书店, 1983.

#### CNE version of Chicago 18th Notes & Bibliography

- Hua Linfu 华林甫. “Qingdai yilai Sanxia diqu shuihan zaihai de chubu yanjiu” 清代以来三峡地区水旱灾害的初步研究 [A preliminary study of floods and droughts in the Three Gorges region since the Qing dynasty]. _Zhongguo shehui kexue_ 中国社会科学 1 (1999): 168–79.
- Kang U-bang 姜友邦. _Wŏnyung kwa chohwa: Han’guk kodae chogaksa ŭi wŏlli_ 圓融과調和: 韓國古代彫刻史의原理 [Synthesis and harmony: Principle of the history of ancient Korean sculpture]. Yŏrhwadang, 1990.
- Abe Yoshio 阿部善雄, and Kaneko Hideo 金子英生. _Saigo no “Nihonjin”: Asakawa Kan’Ichi no shōgai_ 最後の「日本人」: 朝河貫一の生涯 [The last “Japanese”: Life of Kan’ichi Asakawa]. Iwanami Shoten, 1983.

For more examples, see the [bibliography snapshots for all curated styles](https://github.com/boan-anbo/cite-non-english/tree/main/snapshots).

Historically **Zotero’s native item data structure and official CSLs offered no built-in way to render non-English sources**, so scholars often turned to [Juris-M](https://juris-m.github.io/), a forked version of Zotero with multilingual infrastructure. That approach has trade-offs:

- Maintaining Juris-M means keeping two independent Zotero/Juris-M databases.
- Juris-M has effectively ceased active maintenance in the last two years, leaving users without an up-to-date path for English-style citations of non-English sources.

CNE addresses these issues by **bringing robust non-English citation support back to standard Zotero**, eliminating the dual-install burden and providing a maintained path forward. At the same time, **the project stands on the shoulders of Juris-M and its creator**—the groundwork they laid makes CNE possible today. Readers looking for the technical details of how the plugin bridges these gaps can jump to the explanations in the [Detailed Guides](#iii-detailed-guides) section below.

### CNE Features

- Manage multilingual fields in the Cite Non-English (CNE) panel for creators, titles, publisher, journal, series, and other metadata, with original-script and romanized variants stored together.
- Curated CSL styles (Chicago 18th, APA 7th, MLA 8th & 9th and more to come) tailored based on official style handbooks. In Zotero, these styles will be installed automatically when you install CNE and has `CNE` added to the style name.
- Per-item overrides for punctuation, spacing, and name ordering so specialized style requirements are met without manual editing.
- All CNE metadata is stored inside the Zotero item (Extra + CNE panel), so your library stays portable and sync-friendly (no external files required).
- Internal APIs are patched so that any Zotero features and integrations _should_ just work to support CNE. Any compatibility issues should be reported as bugs in the [issue tracker](https://github.com/boan-anbo/cite-non-english/issues).

The **current development focus** is on CJK sources. The infrastructure is intentionally language-agnostic, and the project plans to expand coverage to additional languages as community contributors share requirements, examples, and tests. **If you are interested in contributing to CNE, please [open an issue](https://github.com/boan-anbo/cite-non-english/issues/new) or submit a Pull Request**.

---

## II. Quick Guide

### How to Use CNE

1. **Download** the latest CNE XPI from the [releases page](https://github.com/boan-anbo/cite-non-english/releases) and **install** it in Zotero (Tools → Plugins).

2. For each item, open the **Cite Non-English (CNE)** panel in Zotero's item sidebar and enter the original-script, romanized, and translated information you need.
![Enter CNE citation fields](docs/images/howto-sidebar.png)

3. In the Cite Non-English (CNE) panel choose the item's language, or click the quick language buttons, e.g., "zh-CN", "zh-TW", "ja-JP", "ko-KR".
![Select language](docs/images/howto-language.png)

4. When citing, choose the curated CNE versions of the CSL styles (e.g., "Chicago 18th CNE") so the multilingual fields render correctly.
![Select CNE styles](docs/images/howto-style.png)

5. The citations will render with appropriate romanization, original script, and English translation for names and titles:
![Rendered citations](docs/images/howto-rendered.png)

---

## III. Detailed Guides

### How Zotero Handles Citations

When you store a book, article, or other source in Zotero, all its information—title, author, publisher, and so on—lives in your library as a Zotero item. For fields not natively supported by Zotero, you can add custom information in the Extra field in the format of `key: value` lines--this is how CNE stores its metadata such as `cne-title-original: 清代以来三峡地区水旱灾害的初步研究`.

When you use the citation of the given item(s) (in Word, in a Style Editor preview, or by exporting it to citation data files), Zotero must first convert your item data to CSL-JSON format—a standardized format that citation processors understand. However, due to Zotero's architecture, this conversion happens through **two separate function references**:

**Path 1: Live Citations** (for Style Editor previews, Word/LibreOffice integration, Quick Copy, etc.)

- Uses `Zotero.Utilities.Item.itemToCSLJSON()` to convert → CSL-JSON → Zotero's built-in citation engine (`citeproc-js`) → formatted citation

**Path 2: File Exports** (for BibTeX, Better BibTeX, CSL JSON, etc.)

- Uses `Zotero.Utilities.Translate.prototype.itemToCSLJSON()` to convert → CSL-JSON → export translators → external files (e.g. `.bib` for BibTeX and BibLaTex)

```mermaid
flowchart TB
  Item["Zotero item<br/>(native fields + Extra)"]
  ItemToCSL1["itemToCSLJSON()<br/>(Item.itemToCSLJSON)"]
  ItemToCSL2["itemToCSLJSON()<br/>(Translate.prototype)"]
  CSL1["CSL-JSON"]
  CSL2["CSL-JSON"]
  Engine["Zotero's built-in citation engine<br/>(citeproc-js)"]
  Preview["Preview & style editor"]
  WP["Word / LibreOffice"]
  QuickCopy["Quick Copy"]
  Exporters["Export Translators<br/>(CSL JSON, Better BibTeX)"]
  Files["External files<br/>(BibTeX, CSL JSON, LaTeX)"]

  Item --> ItemToCSL1
  Item --> ItemToCSL2
  ItemToCSL1 --> CSL1
  ItemToCSL2 --> CSL2
  CSL1 --> Engine
  Engine --> Preview
  Engine --> WP
  Engine --> QuickCopy
  CSL2 --> Exporters
  Exporters --> Files

```

> **For developers:** The technical implementation involves patching `Zotero.Utilities.Item.itemToCSLJSON()` (live citations) and `Zotero.Utilities.Translate.prototype.itemToCSLJSON()` (exports), plus configuring the citeproc engine. See [`docs/developer_guide.md`](docs/developer_guide.md#technical-implementation-details) for details.

### Challenges for Citing Non-English Sources

The challenges for supporting non-English citations come from two directions: Zotero and its integrations, and style-guide expectations.

#### From Zotero and its integrations

- **No native field support** – Zotero provides no built-in fields for romanized titles, translated titles, original-script variants, or alternative publisher names. Parallel metadata must be stored in the Extra field and parsed by plugins.

- **Citeproc's limitations and hardcoded internal logic** – The [citeproc engines (`citeproc-js`)](https://github.com/Juris-M/citeproc-js) have limitations and hardcode language-specific handling.
For example, `citeproc-js` has hardcoded special handling for "Asian names" but only included Chinese and Japanese, not Korean. As another example, `citeproc-js` makes formatting decisions on behalf of users without exposing configuration options. For example, romanized Asian names can _only_ (hardcoded logic) render with a single space and no comma between family and given names (e.g., "Hao Chunwen"), making comma-separated formats required by certain styles (see the challenges from the style guides below) unavailable. These decisions are hardcoded into the engine's internal logic and cannot be overridden through CSL. Lack of documentation of the citeproc also makes it difficult to extend and/or circumvent its limitations. But again, despite these flaws, `citeproc-js` provided the critical infrastructure to support multilingual citations in Zotero upon which CNE is built.

- **Undocumented internal APIs** – Citeproc's internal APIs governing name processing and cite-lang-prefs configuration are neither documented nor designed for external use. Implementing CNE requires reverse-engineering these internals and maintaining patches across Zotero updates.

- **CSL's limited extensibility** – [CSL (Citation Style Language)](https://citationstyles.org/), another admirable work in itself, offers basic locale support but lacks extensibility for multilingual citations. Name handling lacks configurability and left to the discretion of citeproc, and there is no official mechanism or conventions for supporting non-English citations. CSL-M, an extended multilingual format developed as part of the Juris-M project and to be used with `citeproc-js`, is not officially recognized by the latest CSL specifications and faces an uncertain future in Zotero's ecosystem.

- **Zotero Built-in styles do not support features for handling non-English sources** – Zotero's curated CSL styles (Chicago, APA, MLA, etc.) provide no support for features such as romanization, original-script, and English translation.

#### From style requirements

- **Parallel scripts, romanization, and English translation** – Humanities and social science style guides (e.g., Chicago, MLA, APA) demand romanized text, original script, and English translations all within the same citation.

  _Example:_ A Chinese journal article title must appear per some guides as:
  > "Qingdai yilai Sanxia diqu shuihan zaihai de chubu yanjiu" 清代以来三峡地区水旱灾害的初步研究 [A preliminary study of floods and droughts in the Three Gorges region since the Qing dynasty]

- **Evolving Asian name conventions** – Recent style guides increasingly require East Asian names to appear in their native order (family name first) without commas, reflecting a shift toward linguistically respectful formatting. Traditionally, names were formatted with Western-style comma separation:

  > Hua, Linfu (Chinese, Pinyin)
  > Ch'ien, Mu (Chinese, Wade-Giles)
  > Kang, U-bang (Korean)
  > Abe, Yoshio (Japanese)

  Modern guidelines (Chicago 18th edition, §11.89-11.99) now recommend the no-comma format followed by original script for scholars based in Asia:

  > Hua Linfu 华林甫
  > Ch'ien Mu 钱穆
  > Kang U-bang 姜友邦
  > Abe Yoshio 阿部善雄

  While well-intentioned, this convention adds further complexity for non-English citations. Additionally, some styles (e.g., Chicago) even recommend "exceptions to exceptions" such as per-author overrides where certain names still need commas despite the general no-comma rule for CJK names. For instance, Korean persons living in the West (referred to in text as "Chang-rae Lee") may still require comma separation (Chicago 17th edition, §16.82):

  > Lee, Chang-rae

  Additionally, specialized formatting such as spacing within Japanese names (with space between family and given name in the original script) demands granular control that standard CSL cannot provide:

  > Takumi Ikeda 池田 巧

- **Special title casing for romanized titles** – Romanized titles often need to be capitalized differently from the English convention. For example:

  > Incorrect: "Qingdai Yilai Sanxia Diqu Shuihan Zaihai De Chubu Yanjiu"

  > Correct: Qingdai yilai Sanxia diqu shuihan zaihai de chubu yanjiu

  Note that "Sanxia" is capitalized because it is a proper noun.

### CNE Solutions

CNE separates concerns between data storage and output formatting to provide stable multilingual citation support without modifying Zotero's core data structures.

#### CNE's Own Architecture

**Stable Data Model**

- All CNE metadata stored in Zotero's Extra field
- Dedicated UI panel for entering original script, romanization, and translations
- **Key design principle for CNE item data**: Complete independence from Zotero's native fields
  - Users can freely choose to fill the native Title/Author fields with romanized, English, or original script, whichever makes sense for the user.
  - CNE output remains the actual values used in creating and exporting the citation regardless of native field content
  - No conflicts between CNE and standard Zotero workflows

**Output via Custom CSL Styles**

- CNE provides curated CSL styles (Chicago 18th CNE, APA 7th CNE, MLA 9th CNE) to make special handling for non-English sources with CNE item data possible. These styles are installed automatically when you install CNE and has `CNE` added to the style name.
- See [`styles/cne/`](styles/cne/) for the curated CSL styles.

**Name Processing with Interceptors**

- Combines citeproc capabilities with custom interceptors
- Injects pre-formatted literal names for per-author control
- Uses `multi.main` and `multi._key` structures for dual-script rendering

#### CNE Integration with Zotero

CNE touches every stage of the pipeline so the metadata you enter in the Cite Non-English (CNE) panel survives previews, exports, and citeproc resets while maintaining backwards compatibility with standard Zotero workflows:

```mermaid
flowchart TB
  subgraph DataEntry["**Data entry & storage**"]
    Panel["CNE sidebar UI<br/>(addon/content)"] --> Extra["Zotero Extra field<br/>cne-* metadata"]
    Extra --> Parser["Parse cne-* lines<br/>(parseCNEMetadata)"]
  end

  subgraph Conversion["**itemToCSLJSON interception**"]
    Item["Zotero item<br/>(native creators + titles)"] --> ItemFn["Zotero.Utilities.Item.itemToCSLJSON()"]
    Item --> TranslateFn["Zotero.Utilities.Translate.prototype.itemToCSLJSON()"]
    Parser --> Callbacks["Intercept + inject CSL vars<br/>(ItemToCSLJSONInterceptor)"]
    ItemFn --> Callbacks
    TranslateFn --> Callbacks
    Callbacks --> CSL["CSL-JSON enriched with<br/>cne-* variables"]
  end

  subgraph Citeproc["**Citeproc configuration**"]
    CSL --> CiteprocEngine["Citeproc engine<br/>(citeproc-js / citeproc-rs)"]
    CiteprocEngine --> Preview["Preview & style editor"]
    CiteprocEngine --> WP["Word / LibreOffice integration"]
    CiteprocEngine --> QuickCopy["Quick Copy & API previews"]
  end

  subgraph StyleConfig["**Style-driven config**"]
    Style["CNE CSL style<br/>(CNE-CONFIG)"] --> Configure["configureCiteprocForCNE()"]
  end
  Configure --> CiteprocEngine

  subgraph Exports["**Export path**"]
    CSL --> Translators["Export translators<br/>(CSL JSON, Better BibTeX, …)"]
    Translators --> Bib["BibLaTeX interceptor<br/>itemToExportFormat"]
    Translators --> Files["External files<br/>(BibTeX, CSL JSON, LaTeX)"]
  end

  Extra --> Bib
  Bib --> Files

  classDef cne fill:#fde6d4,stroke:#d25c1b,color:#1f140f;
  class Panel,Extra,Parser,Callbacks,CSL,Style,Configure,Bib cne;
```

_Nodes shaded in orange represent CNE-specific additions layered on top of Zotero's native pipeline, while the unshaded nodes correspond directly to the core architecture shown in the previous diagram._

**How CNE works:**

The diagram above shows CNE's intervention points (orange nodes) in Zotero's citation pipeline. Here's what happens at each stage:

1. **Entering and storing CNE metadata** (Panel → Extra)

   When you fill in the Cite Non-English (CNE) panel—entering romanized titles like "Tang houqi wudai Songchu", original scripts like 唐后期五代宋初, English translations like "[The social existence of monks...]", and the same for authors, journals, and publishers—CNE immediately saves this information into Zotero's Extra field as specially-formatted `cne-*` lines. This structured storage ensures your metadata persists with the item and survives sync, backup, and migration.

2. **Parsing CNE metadata from the Extra field** (Parser)

   Before Zotero converts an item to citation format, CNE's parser reads the Extra field and extracts all `cne-*` lines into a structured internal representation. For each field (title, container-title, publisher), the parser separates romanized, original, and English variants. For authors, it indexes each creator with their position (e.g., `cne-author-0-last-romanized`, `cne-author-0-last-original`) so they can be matched to Zotero's creator array later.

3. **Enriching CSL-JSON with CNE variables** (Callbacks → CSL)

   CNE intercepts both of Zotero's conversion paths—the live citation path (`itemToCSLJSON()`) and the export path (`Translate.prototype.itemToCSLJSON()`)—and injects the parsed CNE metadata directly into the CSL-JSON object that citeproc consumes. Simple fields become new CSL variables (e.g., `cne-title-romanized`, `cne-container-title-original`). Authors require deeper enrichment: CNE matches indexed creator data to each name in the CSL creator array, filling in romanized `family`/`given` slots and setting `multi.main` and `multi._key` objects so citeproc can render both romanization and original script in the order you've configured.

4. **Configuring citeproc for multi-slot rendering** (Style + Configure)

   When Zotero initializes a citeproc engine, CNE reads the `CNE-CONFIG` metadata embedded in the CSL style file to determine display preferences—for example, whether to show both romanized and original author names (`["translit", "orig"]`) or just romanized (`["translit"]`), and how to format romanized CJK names (with or without commas, with or without spacing in the original script). CNE then applies these preferences to the engine's `cite-lang-prefs` setting and installs a persistent override hook that reapplies the configuration whenever citeproc internally resets it during processing. This ensures the Style Editor, bibliography previews, and Word integration all consistently render the parallel scripts you expect.

5. **Preparing BibLaTeX exports** (Bib)

   When you export items to BibTeX or Better BibTeX, CNE intercepts the export conversion process and transforms CNE metadata into BibLaTeX-compatible fields. Romanized titles become `title`, original scripts become `userf`, English translations become `usere`, and similar mappings apply to journals, publishers, and authors. CNE writes these transformed fields into a temporary copy of the item's Extra field that only the export translator sees, ensuring your stored data remains unchanged while Better BibTeX receives properly-formatted metadata it can parse and render in your LaTeX documents.

**The result:** Whether you're previewing a citation in Zotero, inserting it into a Word document, viewing it in the Style Editor, or exporting your entire library to BibTeX, your non-English sources consistently appear with all the parallel information (romanization, original script, and English translation) properly formatted according to your chosen style guide.

> **For developers:** Detailed technical implementation information, including interceptor architecture, callback chains, and source code locations, is available in [`docs/developer_guide.md`](docs/developer_guide.md#technical-implementation-details).

### Known Issues

- Only curated CSL styles receive enhanced behaviour; others fall back to Zotero's native formatting.
- **Items must have the correct language selected in the Cite Non-English (CNE) panel**—choosing `en` or leaving the field empty intentionally bypasses _some_ of CNE processing. So when you notice weird output, such as romanized names with comma when it shouldn't, make sure if you have selected the correct language.
- Integration with Better BibTeX is not yet fully implemented and tested. It's the next item on the roadmap.

---

## IV. Development

### Building on CNE

#### Project Layout & Key Modules

- `src/modules/cne/` – interceptors, callbacks, integration, preference helpers.
- `addon/content/` – sidebar UI, localisation, preference panel.
- `test/csl-tests/` – Mocha specs, fixtures, snapshots.

For more details, see [`docs/developer_guide.md`](docs/developer_guide.md).

### Testing

The output of all curated styles is consolidated with thorough testing. Run `npm test` to execute Mocha specs and update snapshots under `snapshots/` with `npm run test:snapshots:update`.

---

## V. FAQ

**Q: What if I need a style that CNE hasn't curated yet?**

A: Open an issue with your request, or follow the Detailed Guides (III.3) to adapt the infrastructure and create a CNE-compatible style yourself.

**Q: Does CNE affect Zotero sync?**

A: No. CNE stores all metadata in Zotero's Extra field, which syncs normally across devices. Your CNE data travels with your library.

**Q: I'm formatting citation using a Japanese APA style, but the output of CNE APA 7th style does not look right.**

A: It's because CNE APA 7th style is the _English_ APA style with support for citing non-English sources. Picking Japanese locale for the English APA style does not really give you the correct output either. What you need is a dedicated _Japanese_ APA style with CSL plus CNE support for providing CNE item data. If you don't know how to create a CSL style, raise an issue and if enough people are interested, I'll consider adding it to the curated styles.

**Q: What happens if I disable or uninstall the plugin?**

A: Your data remains safe in the Extra field. CNE metadata lines (starting with `cne-`) stay in your items but won't be processed without the plugin active. Re-enabling CNE restores full functionality.

**Q: Does CNE modify my stored items permanently?**

A: CNE only modifies the Extra field when you enter data through the Cite Non-English (CNE) panel. It does not alter your original Title, Author, or other native Zotero fields. In fact, it does not even **use** the native fields for citation output.

**Q: Which Zotero versions are supported?**

A: CNE supports the latest Zotero 7+. Please raise an issue if you find any compatibility issues.

---

## VI. Selected References

- Official style handbooks, including Chicago, MLA, and APA.
- [UBC Library: CNE (Cite Non-English) Citation Guide](https://guides.library.ubc.ca/c.php?g=707463&p=5291936)
- [Yale CJK Citation Styles](https://guides.library.yale.edu/c.php?g=296262)
- [Handling Non-English Metadata in Zotero](https://jdavidstark.com/how-to-easily-handle-non-english-citation-information-in-zotero/)
- [Customizing Chicago 17 for Japanese/Chinese](https://gist.github.com/tom-newhall/88557892c6646b8cfda9e8963c2b733d)
- [CSL Forum: Rendering Japanese Author Names](https://discourse.citationstyles.org/t/is-it-possible-to-render-name-part-affixes-in-japanese-author-names/1828/18)

---

## VII. License

AGPL-3.0-or-later. Same license as Zotero.

---

## Acknowledgments

Special thanks to 龔麗坤 and WM for their help and advice on Japanese and Korean citation conventions.

---

Bo An

2025
