# Cite Non-English (CNE)

[![zotero target version](https://img.shields.io/badge/Zotero-7-green?style=flat-square&logo=zotero&logoColor=CC2936)](https://www.zotero.org)
[![Using Zotero Plugin Template](https://img.shields.io/badge/Using-Zotero%20Plugin%20Template-blue?style=flat-square&logo=github)](https://github.com/windingwind/zotero-plugin-template)

An all-in-one Zotero plugin for citing non-English materials in academic writing, with comprehensive support for parallel titles, romanization, translations, and locale-aware formatting.

## The Problem

Citing CNE (Cite Non-English) sources in academic work requires handling multiple parallel fields:

- **Original script**: Native characters (汉字, 漢字, かな, 한글)
- **Romanization**: Pinyin, Romaji, Revised Romanization
- **Translation**: English or other language translations
- **Proper casing**: Preventing incorrect English auto-capitalization

Previously, this required [Juris-M](https://juris-m.github.io/) (a modified Zotero fork), which pioneered multilingual citation support but faces significant limitations:
- **Declining maintenance**: Development has slowed considerably, with decreasing update frequency
- **Dual installation burden**: Requires maintaining a completely separate Zotero installation
- **Library synchronization complexity**: Managing two different Zotero instances is inconvenient for most users
- **Limited compatibility**: Update cycles lag behind official Zotero releases

## The Solution

**Cite Non-English (CNE)** provides an all-in-one solution that works directly with standard Zotero:

1. **Internal data model**: Store all CNE (Cite Non-English) metadata in a structured format using Zotero's Extra field
2. **Custom UI panel**: User-friendly interface in the item pane for managing CNE (Cite Non-English) fields
3. **Output adaptation**: Transform stored data for different workflows:
   - **LaTeX users**: Export via Better BibTeX with proper `titleaddon`, `booktitleaddon` fields
   - **Word/LibreOffice users**: Compatible CSL styles with proper language handling
4. **Long-term maintenance**: Focused scope, doing one thing well

## Implementation Approach

CNE employs two complementary strategies to overcome limitations in Zotero's citation processing:

### 1. Interceptors and Monkey Patching

CNE intercepts Zotero's citation generation pipeline to work around fundamental limitations in the CSL (Citation Style Language) processor. This approach is necessary because:
- **Name formatting challenges**: CSL cannot handle per-author customization (e.g., mixing romanized-first and original-first formats in a single bibliography)
- **Character spacing**: Adding appropriate spacing for Japanese names requires pre-processing
- **Locale-aware display**: Formatting creator names based on language context (e.g., CJK "LastFirst" vs. Western "Last, First")

The interceptors modify CSL-JSON data before it reaches the CSL processor, enabling sophisticated formatting that would be impossible to achieve through CSL alone.

### 2. Maintained CSL Styles

CNE provides and maintains custom CSL style files in two categories:

**Enhanced English styles**: Modified versions of standard citation styles (Chicago, APA, MLA) with proper support for citing non-English materials within English-language writing. These styles handle:
- Parallel titles (original, romanized, translated)
- Proper punctuation and formatting for multilingual bibliographies
- Language-specific formatting rules

**Non-English styles**: Native-language citation styles for academic writing in other languages (e.g., Japanese APA, Chinese GB/T standards).

We actively welcome community contributions of additional CSL styles to expand language and discipline coverage.

## Current Language and Style Support

### Supported Languages

**Primary focus**: CJK languages
- Chinese (Simplified, Traditional): zh-CN, zh-TW, zh-HK, zh-SG
- Japanese: ja-JP
- Korean: ko-KR

While CNE currently prioritizes CJK languages due to their unique citation requirements, the plugin is designed with a **generic, extensible architecture** to support any non-English language. The data model, UI components, and processing pipeline are language-agnostic, making it straightforward to add support for:
- Cyrillic scripts (Russian, Ukrainian, Bulgarian, etc.)
- Arabic and Hebrew (RTL languages)
- South Asian languages (Hindi, Bengali, Tamil, etc.)
- European languages with special characters

We encourage contributions for additional languages and welcome feedback from users working with non-CJK materials.

### Supported Citation Styles

**Currently maintained**:
- **Chicago Manual of Style** (Notes and Bibliography)
- **APA** (American Psychological Association)
- **MLA** (Modern Language Association)

These three styles are:
- The most widely used in English-language academic writing
- Have the most detailed published requirements for handling non-English sources
- Particularly important for CJK citation formatting (comprehensive guidelines from major style guides)

Additional citation styles will be added based on community needs and contributions.

## Architecture

### Internal Data Model

Cite CNE (Cite Non-English) maintains a canonical data model stored in Zotero's Extra field using the `cne-*` namespace (hyphenated format required for CSL compatibility):

```
cne-title-original: 日本仏教綜合研究
cne-title-english: Japanese Buddhist Comprehensive Research
cne-title-romanized: Nihon Bukkyō Sōgō Kenkyū
cne-original-language: ja-JP
```

#### Field Naming Convention

For each relevant field, we store three variants:

- `{field}-original`: Original script (汉字, 漢字, かな, 한글)
- `{field}-english`: English translation
- `{field}-romanized`: Romanization (Pinyin, Romaji, etc.)

Plus one metadata field:

- `original-language`: ISO language code (zh-CN, ja-JP, ko-KR)

#### Supported Fields

Based on APA, MLA, and Chicago style requirements for CNE (Cite Non-English) citations:

- `title`: Article/book title
- `booktitle`: Container title (for chapters, articles)
- `author`: Author names
- `publisher`: Publisher name
- `journal`: Journal title
- `series`: Series title
- _(More fields to be added based on community feedback)_

#### Why Store `-original` When Zotero Has Native Fields?

**Stability and reliability:**
- Users often modify native fields while troubleshooting citations
- WorldCat and other databases may provide English titles for CNE (Cite Non-English) sources
- Preserves authoritative source data as a stable reference point

### Interceptor Architecture: Author Name Handling

#### The Challenge: CSL Limitations

Citation Style Language (CSL) processors cannot handle per-author customization because:

1. **No index accessor**: CSL lacks syntax to refer to individual authors (can't write `author[0]` vs `author[1]`)
2. **Uniform formatting**: `<name-part>` affixes apply to ALL authors identically
3. **No conditional formatting**: Cannot format individual names differently within a single citation

This makes it impossible to render mixed scripts properly using CSL alone. For example, you cannot show:
- Author 1: "Hao, Chunwen 郝春文" (romanized-first)
- Author 2: "山田太郎 Yamada Tarō" (original-first)

#### The Solution: CSL-JSON Interception

Instead of modifying CSL stylesheets (which is not viable), we **intercept Zotero's CSL-JSON conversion** before it reaches the CSL processor.

##### How It Works

```
Zotero Item → [INTERCEPTOR] → Enhanced CSL-JSON → CSL Processor → Citation
                    ↑
            Inject literal names
            based on CNE metadata
```

**Key Components:**

1. **ItemToCSLJSONInterceptor** - Monkey patches Zotero's `itemToCSLJSON()` function
2. **EnrichAuthorNames Callback** - Transforms author names from CNE metadata
3. **Dual-Path Interception** - Catches BOTH code paths (see below)

##### Dual-Path Interception (Critical)

Zotero has **TWO separate code paths** for CSL-JSON conversion:

**Path 1: Direct Usage** (`Zotero.Utilities.Item.itemToCSLJSON`)
- Used by: Citation preview, bibliography generation, Word/LibreOffice integration
- Call sites: cite.js, editorInstance.js, integration.js

**Path 2: Translator Sandbox** (`Zotero.Utilities.Translate.prototype.itemToCSLJSON`)
- Used by: Export translators (CSL JSON, Better BibTeX, etc.)
- Copied at Zotero startup from Path 1

**Why both must be intercepted:**

The translator's version is copied **once** at Zotero startup. Patching only Path 1 after plugin load means:
- ✅ Path 1 (direct usage) sees the patched version
- ❌ Path 2 (translators) still uses the OLD reference

**Solution:** Patch BOTH paths simultaneously:
```javascript
// Path 1: Direct usage
Zotero.Utilities.Item.itemToCSLJSON = interceptorWrapper;

// Path 2: Translator sandbox (MUST be separate!)
Zotero.Utilities.Translate.prototype.itemToCSLJSON = interceptorWrapper;
```

##### Literal Name Format

The interceptor converts structured names to **literal names**:

**Standard CSL-JSON (structured)**:
```json
{
  "author": [
    {
      "family": "Hao",
      "given": "Chunwen"
    }
  ]
}
```

**CNE-Enhanced (literal)**:
```json
{
  "author": [
    {
      "literal": "Hao, Chunwen 郝春文"
    }
  ]
}
```

The literal format bypasses CSL's name parsing entirely, rendering the string as-is. This gives complete control over individual author formatting.

##### Flexible Formatting Options

Each author can have independent formatting options stored in Extra:

```
cne-author-0-last-original: 郝
cne-author-0-first-original: 春文
cne-author-0-last-romanized: Hao
cne-author-0-first-romanized: Chunwen
cne-author-0-options: {"spacing":"comma","order":"romanized-first"}
```

**Spacing Options:**
- `comma`: "Hao, Chunwen 郝春文" (Western style)
- `space`: "Hao Chunwen 郝春文" (Space-separated)
- `none`: "HaoChunwen 郝春文" (No separator)

**Order Options:**
- `romanized-first`: "Hao, Chunwen 郝春文"
- `original-first`: "郝春文 Hao, Chunwen"

**Examples:**

| Language | Options | Output |
|----------|---------|--------|
| Chinese | `{"spacing":"comma","order":"romanized-first"}` | Hao, Chunwen 郝春文 |
| Japanese | `{"spacing":"space","order":"original-first"}` | 山田太郎 Yamada Tarō |
| Korean | `{"spacing":"comma","order":"romanized-first"}` | Kang, U-bang 강우방 |
| Russian | `{"spacing":"space","order":"romanized-first"}` | Ivanov Ivan Иванов Иван |

##### Testing Both Paths

To verify the interceptor works:

1. **Test Path 1**: Right-click item → "Create Bibliography from Item" ✅
2. **Test Path 2**: Right-click item → "Export Item..." → CSL JSON ✅

Both should show literal names in output. See `test/csl-tests/TESTING-AUTHORS.md` for comprehensive testing guide.

### Output Adaptation Layer

The plugin transforms the internal model for different output formats:

#### For LaTeX (BibLaTeX Chicago)

BibLaTeX Chicago provides native support for CJK (Chinese/Japanese/Korean) citations through extended author and title fields.

**CNE Metadata Mapping:**

The plugin exports CNE metadata to BibLaTeX format compatible with biblatex-chicago:

| CNE Field | BibLaTeX Field | Example |
|-----------|---------------|---------|
| Author (romanized) | `author = {family=..., given=...}` | `family=Hao, given=Chunwen` |
| Author (original) | `cjk=\textzh{...}` | `cjk=\textzh{郝春文}` |
| Title (romanized) | `title = {...}` | `Tang houqi wudai Songchu...` |
| Title (original) | `titleaddon = {\textzh{...}}` | `\textzh{唐後期五代宋初...}` |
| Title (translation) | `usere = {...}` | `The social existence of...` |
| Journal (romanized) | `journaltitle = {...}` | `Zhongguo shehui kexue` |
| Journal (original) | `journaltitleaddon = {\textzh{...}}` | `\textzh{中國社會科學}` |

**Example BibLaTeX Entry:**

```bibtex
@Article{hua:cms,
  author     = {family=Hua, given=Linfu, cjk=\textzh{華林甫}},
  title      = {Qingdai yilai Sanxia diqu shuihan zaihai de chubu yanjiu},
  titleaddon = {\textzh{清代以來三峽地區水旱災害的初步研究}},
  options    = {ctitleaddon=space,nametemplates=cjk},
  usere      = {A preliminary study of floods and droughts in the
               Three Gorges region since the Qing dynasty},
  journaltitle = {Zhongguo shehui kexue},
  journaltitleaddon = {\textzh{中國社會科學}},
  volume = 1,
  date   = {1999},
  pages  = {168--179},
}
```

**Key Options:**
- `ctitleaddon=space` - No punctuation between title and titleaddon
- `nametemplates=cjk` - Use CJK name order (family first)
- `\textzh{...}` - Mark text as Chinese (requires babel or similar)

**Rendered Output (Chicago Notes):**
> Hua Linfu 華林甫, "Qingdai yilai Sanxia diqu shuihan zaihai de chubu yanjiu 清代以來三峽地區水旱災害的初步研究 [A preliminary study of floods and droughts in the Three Gorges region since the Qing dynasty]," *Zhongguo shehui kexue* 中國社會科學 1 (1999): 168–179.

See `reference/biblatex-chicago-cjk-example.bib` for more examples.

#### For Word/LibreOffice (CSL)

- Sets Zotero's Language field (e.g., `ja-JP`) to prevent incorrect English casing
- Provides or recommends CSL styles that support CNE (Cite Non-English) citations
- May embed custom CSL styles if needed

## Features

### Comprehensive Metadata Management

CNE extends Zotero's native fields to capture all variants of non-English bibliographic information:

#### Supported Fields

Each field can store three variants:

- **Original script**: Preserve titles, names, and publisher information in native script (汉字, 漢字, かな, 한글, Кириллица, etc.)
- **Romanized form**: Store transliterated versions (Pinyin, Romaji, Revised Romanization, etc.)
- **English translation**: Add English translations for accessibility

**Currently supported fields**:
- **Title**: Book/article titles with full tri-variant support
- **Book title**: Container titles for chapters and articles
- **Journal**: Journal names with original and romanized variants
- **Publisher**: Publisher names with translation support
- **Series**: Series titles
- **Authors/Creators**: Multi-variant name support with flexible formatting options

All CNE metadata is stored in Zotero's `Extra` field using a structured namespace (`cne-*`), ensuring:
- No interference with Zotero's native functionality
- Full compatibility with Zotero sync and backup
- Easy migration and portability

### Advanced Name Formatting

CNE provides sophisticated control over creator name formatting:

#### Japanese Name Spacing
Add appropriate spacing between Japanese names (e.g., `山田太郎` → `山田 太郎`)

#### Parallel Name Display
Support multiple display formats:
- **Romanized-first**: `Hao, Chunwen 郝春文` (standard for English-language citations)
- **Original-first**: `郝春文 Hao, Chunwen` (sometimes preferred for East Asian publications)
- **Spacing options**: Control comma/space/no-separator between romanized and original forms

#### Per-Author Customization
Each author can have independent formatting rules, allowing mixed bibliographies with appropriate formatting for each name's origin.

### User Interface Features

#### Custom Item Pane Section

A dedicated CNE section in Zotero's item pane provides:
- **Input fields** for all metadata variants (original, romanized, English)
- **Language dropdown** with quick-access buttons for frequently used languages
- **Real-time preview** of citation formatting
- **Field counter** to track metadata completeness
- **Clear buttons** for easy field management

#### Quick Language Selection

Customizable quick-access buttons below the language dropdown for instant selection of common languages. Defaults:
- zh-CN, zh-TW (Chinese Simplified/Traditional)
- ja-JP (Japanese)
- ko-KR (Korean)
- ru-RU (Russian)
- ar (Arabic)
- de-DE, fr-FR (German, French)

Fully customizable via plugin preferences (comma-separated list).

#### Locale-Aware "Creators Full" Column

Custom column for Zotero's item list with intelligent name formatting:
- **CJK languages**: `姓名` format (no comma, no space) - e.g., `王小波`
- **Western languages**: `Last, First` format - e.g., `Orwell, George`

Language detection uses multiple signals:
1. Zotero's language field
2. CNE metadata
3. Character-based detection (Unicode ranges)

### Export Features

#### CSL JSON Export
Export items with complete CNE metadata in CSL-JSON format for:
- Citation style development and testing
- Debugging formatting issues
- Sharing with collaborators

#### Citation Preview
Preview how citations will appear in different styles before inserting into documents, ensuring proper formatting.

## Understanding Locale in Citations

### How Locale Affects Citation Formatting

Zotero and CSL use the item's `language` field to determine locale-specific formatting. However, locale handling has important nuances that can cause confusion:

#### The Locale Problem: Example with APA

When you set an item's language to Japanese (`ja-JP`):
- CSL automatically uses **Japanese localization** for standard terms
  - "editor" becomes 編者
  - "edition" becomes 版
  - "volume" becomes 巻
- **However**: The citation still follows **English APA format rules**
- This creates a **hybrid output** that mixes Japanese terms with English structure

**Example of problematic output**:
> Yamada, T. (2020). Book title. (2 版). Publisher名.

This mixing of Japanese and English is often not what you want - it's neither proper Japanese APA nor proper English APA.

#### The Solution

**For English-language writing citing Japanese sources**:
Use CNE's enhanced English citation styles, which:
- Keep English terms (editor, edition, volume)
- Properly format non-English titles and names
- Add parallel information (romanized/original) as needed

**For Japanese-language writing**:
Use proper Japanese citation styles (Japanese APA, Japanese Chicago) where all elements follow Japanese conventions.

### CNE's Approach to Locale

CNE handles the language field intelligently:

1. **Language field determines formatting rules**: The `language` field tells CNE which language-specific formatting to apply (name order, spacing, etc.)

2. **Interceptors apply formatting before CSL**: CNE's interceptors format names and add parallel information before the CSL processor runs, ensuring clean output

3. **Style-appropriate term selection**: When using English citation styles, CNE ensures English terms are used, while when using non-English styles, appropriate localization applies

**Current status**: The separation between Zotero's native `language` field and CNE's metadata handling works well without conflicts. A separate "CNE locale" field may be added in future versions if edge cases require it, but current testing shows this is not necessary.

## Features (Planned)

### Phase 1: Core Functionality ✅
- ✅ Project setup and infrastructure
- ✅ CSL testing infrastructure with automated tests
- ✅ Custom item pane section with UI for managing CNE fields
- ✅ Parse/generate Extra field with `cne-*` namespace
- ✅ Support for title, booktitle, author, journal, publisher, and series fields
- ✅ Language dropdown with customizable quick-access buttons
- ✅ Locale-aware "Creators Full" column
- ✅ CSL-JSON export with CNE metadata
- ✅ Citation preview dialog
- ✅ Interceptor architecture for author name formatting

### Phase 2: Better BibTeX Integration (In Progress)
- ✅ BibLaTeX export integration (itemToExportFormat interceptor)
- ✅ Documentation and examples for LaTeX workflow
- [ ] Comprehensive testing with common LaTeX citation styles
- [ ] User-configurable BibLaTeX field mappings

### Phase 3: CSL Style Support (In Progress)
- ✅ CSL style repository structure (`styles/cne/`, `styles/upstream/`)
- ✅ Git submodule integration for upstream CSL styles
- [ ] Complete CNE-enhanced versions of Chicago, APA, MLA
- [ ] Language field auto-configuration
- [ ] Comprehensive testing with Word/LibreOffice output
- [ ] Style distribution and auto-update mechanism

### Phase 4: Advanced Features
- [ ] Batch operations (add CNE (Cite Non-English) fields to multiple items)
- [ ] Import helpers for CNE (Cite Non-English) databases (CNKI, CiNii, RISS)
- [ ] Romanization helpers (auto-generate pinyin/romaji)
- [ ] Validation and completeness warnings
- [ ] Multi-language UI (English, non-English)

## Installation

### Requirements

- Zotero 7 or later
- (Optional) [Better BibTeX](https://retorque.re/zotero-better-bibtex/) for LaTeX workflows

### Install from GitHub Releases

1. Download the latest `.xpi` file from [Releases](https://github.com/boan-anbo/cne/releases)
2. In Zotero, go to Tools → Add-ons
3. Click the gear icon, select "Install Add-on From File"
4. Select the downloaded `.xpi` file

### Manual Installation (Development)

See [Development Setup](#development-setup) below.

## Usage

### Basic Workflow

1. **Add CNE (Cite Non-English) metadata to your items:**
   - Select an item in your Zotero library
   - Open the "Cite CNE (Cite Non-English)" panel in the right sidebar (alongside Info, Notes, Tags, etc.)
   - Enter original, romanized, and English variants of titles and authors
   - Select the original language from the dropdown

2. **For LaTeX users:**
   - Export your library using Better BibTeX
   - The `titleaddon` and `booktitleaddon` fields will be populated automatically
   - Use with your preferred BibLaTeX styles

3. **For Word/LibreOffice users:**
   - Use recommended CNE (Cite Non-English)-compatible CSL styles
   - The plugin automatically sets language fields to prevent incorrect casing
   - Insert citations normally through Zotero

### Examples

_Coming soon: Screenshots and step-by-step examples_

## Development Setup

### Prerequisites

1. Install [Zotero 7 Beta](https://www.zotero.org/support/beta_builds)
2. Install [Node.js](https://nodejs.org/) (LTS version) and [Git](https://git-scm.com/)

### Clone and Build

```bash
git clone https://github.com/boan-anbo/cne.git
cd cne
npm install
```

### Configure Development Environment

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and configure paths:
   ```env
   ZOTERO_PLUGIN_ZOTERO_BIN_PATH = /Applications/Zotero.app/Contents/MacOS/zotero
   ZOTERO_PLUGIN_PROFILE_PATH = /path/to/your/dev/profile
   ```

   Create a development profile:
   ```bash
   /Applications/Zotero.app/Contents/MacOS/zotero -p
   ```

### Start Development

```bash
npm start
```

This will:
- Build the plugin in development mode
- Launch Zotero with the plugin loaded
- Watch for file changes and automatically reload

### Build for Production

```bash
npm run build
```

The XPI file will be in `.scaffold/build/`.

### CSL Style Testing

Test custom CSL styles programmatically using the included citeproc-js-server:

1. **First time setup**:
   ```bash
   cd tools/citeproc-js-server
   npm install
   ```

2. **Start citeproc server** (in one terminal):
   ```bash
   cd tools/citeproc-js-server && npm start
   ```

3. **Run CSL tests** (in another terminal):
   ```bash
   npm run test:csl
   ```

See `test/csl-tests/README.md` for detailed testing guide.

## Maintaining Template Updates

This project is based on [windingwind/zotero-plugin-template](https://github.com/windingwind/zotero-plugin-template) and maintains a reference to the upstream template for updates.

### Pulling Template Updates

The repository has an `upstream-template` branch that tracks the original template:

```bash
# Fetch latest changes from upstream
git fetch upstream

# View what changed in the template
git log upstream-template..upstream/main

# Merge template updates into your local tracking branch
git checkout upstream-template
git merge upstream/main

# Selectively merge updates into main
git checkout main
git merge upstream-template
# Or cherry-pick specific commits:
git cherry-pick <commit-hash>
```

### Remote Configuration

- `origin`: Your fork at `https://github.com/boan-anbo/cne.git`
- `upstream`: Template at `https://github.com/windingwind/zotero-plugin-template.git`
- `upstream-template`: Local branch tracking `upstream/main`

## Contributing

Contributions are welcome! CNE aims to be a community-driven, long-term maintained solution for non-English citations in Zotero.

### Priority Contribution Areas

#### CSL Styles (Most Needed!)

We actively seek contributions for:

**Enhanced English-language styles**:
- Modified versions of standard styles (Chicago, APA, MLA, etc.) with proper non-English source handling
- Discipline-specific styles with multilingual support
- Regional style variants (e.g., Chicago for East Asian studies)

**Non-English citation styles**:
- Native-language styles (Japanese APA, Chinese GB/T 7714, Korean standards, etc.)
- Academic styles from non-English-speaking countries
- Journal-specific citation requirements

See `styles/README.md` for style contribution guidelines and testing procedures.

#### Language Support

- **Formatting rules**: Contribute language-specific name formatting, spacing rules, and punctuation conventions
- **Character detection**: Help improve Unicode range detection for new scripts
- **Locale data**: Provide language codes and regional variants
- **Examples and test cases**: Submit real-world citation examples for your language

#### Testing and Feedback

- Test with real non-English sources across different languages and scripts
- Report compatibility issues with specific citation styles or workflows
- Validate output against published style guides (Chicago Manual, APA Publication Manual, etc.)
- Share edge cases and challenging citation scenarios

#### Documentation and Localization

- **UI translations**: Translate plugin interface to additional languages
- **Workflow guides**: Document best practices for specific disciplines or languages
- **Tutorial videos**: Create visual guides for common tasks
- **Citation examples**: Contribute annotated examples of properly formatted citations

### Feature Requests

Suggest new fields, formatting options, or features based on your citation needs. We prioritize features that:
- Solve real problems encountered in academic writing
- Benefit multiple languages/disciplines (generic solutions preferred)
- Align with published citation style requirements

### Development Guidelines

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Resources

### CNE (Cite Non-English) Citation Guidelines

- [UBC Library: CNE (Cite Non-English) Citation Guide](https://guides.library.ubc.ca/c.php?g=707463&p=5291936)
- [Yale: Citation Style for Chinese, Japanese and Korean Sources](https://guides.library.yale.edu/c.php?g=296262)
- [How to Easily Handle Non-English Citation Information in Zotero](https://jdavidstark.com/how-to-easily-handle-non-english-citation-information-in-zotero/)

### CSL and Citation Processing

- [Customizing Chicago 17 for Japanese and Chinese Citations](https://gist.github.com/tom-newhall/88557892c6646b8cfda9e8963c2b733d) - Tom Newhall's exploration of CSL customization for CJK names
- [CSL Discussion: Rendering Japanese Author Names](https://discourse.citationstyles.org/t/is-it-possible-to-render-name-part-affixes-in-japanese-author-names/1828/18) - Community discussion on CSL limitations for per-author formatting

### Zotero Plugin Development

- [Zotero 7 Developer Documentation](https://www.zotero.org/support/dev/zotero_7_for_developers)
- [Zotero Plugin Toolkit](https://github.com/windingwind/zotero-plugin-toolkit)
- [Zotero Types](https://github.com/windingwind/zotero-types)

### Better BibTeX

- [Better BibTeX Documentation](https://retorque.re/zotero-better-bibtex/)
- [Extra Fields Syntax](https://retorque.re/zotero-better-bibtex/exporting/extra-fields/)

## Roadmap

### Version 0.1.0 (MVP)
- Basic UI panel for title and author fields
- Extra field parser/generator
- Better BibTeX export for `titleaddon`

### Version 0.2.0
- Support for all major fields (publisher, journal, series)
- Batch operations
- Validation and warnings

### Version 0.3.0
- CSL style integration
- Language auto-configuration
- Import helpers

### Version 1.0.0
- Stable API
- Complete documentation
- Multi-language UI
- Comprehensive test coverage

## License

AGPL-3.0-or-later

This project is built on the [Zotero Plugin Template](https://github.com/windingwind/zotero-plugin-template) by windingwind.

## Support

- [Report issues](https://github.com/boan-anbo/cne/issues)
- [Discussions](https://github.com/boan-anbo/cne/discussions)

## Acknowledgments

- [windingwind](https://github.com/windingwind) for the excellent Zotero Plugin Template
- The Zotero team for creating an extensible research tool
- The CNE (Cite Non-English) research community for feedback and requirements
