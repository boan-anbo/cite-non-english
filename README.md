# Cite CJK

[![zotero target version](https://img.shields.io/badge/Zotero-7-green?style=flat-square&logo=zotero&logoColor=CC2936)](https://www.zotero.org)
[![Using Zotero Plugin Template](https://img.shields.io/badge/Using-Zotero%20Plugin%20Template-blue?style=flat-square&logo=github)](https://github.com/windingwind/zotero-plugin-template)

A Zotero plugin for managing CJK (Chinese, Japanese, Korean) citation metadata with support for parallel titles, romanization, and translation.

## The Problem

Citing CJK sources in academic work requires handling multiple parallel fields:

- **Original script**: Native characters (汉字, 漢字, かな, 한글)
- **Romanization**: Pinyin, Romaji, Revised Romanization
- **Translation**: English or other language translations
- **Proper casing**: Preventing incorrect English auto-capitalization

Previously, this required [Juris-M](https://juris-m.github.io/) (a modified Zotero fork), which:
- Required maintaining a separate Zotero installation
- Had limited compatibility and update cycles
- Created vendor lock-in

## The Solution

**Cite CJK** provides a unified approach that works with standard Zotero:

1. **Internal data model**: Store all CJK metadata in a structured format using Zotero's Extra field
2. **Custom UI panel**: User-friendly interface in the item pane for managing CJK fields
3. **Output adaptation**: Transform stored data for different workflows:
   - **LaTeX users**: Export via Better BibTeX with proper `titleaddon`, `booktitleaddon` fields
   - **Word/LibreOffice users**: Compatible CSL styles with proper language handling
4. **Long-term maintenance**: Focused scope, doing one thing well

## Architecture

### Internal Data Model

Cite CJK maintains a canonical data model stored in Zotero's Extra field using the `cite-cjk.*` namespace:

```
cite-cjk.title-original: 日本仏教綜合研究
cite-cjk.title-english: Japanese Buddhist Comprehensive Research
cite-cjk.title-romanized: Nihon Bukkyō Sōgō Kenkyū
cite-cjk.original-language: ja-JP
```

#### Field Naming Convention

For each relevant field, we store three variants:

- `{field}-original`: Original script (汉字, 漢字, かな, 한글)
- `{field}-english`: English translation
- `{field}-romanized`: Romanization (Pinyin, Romaji, etc.)

Plus one metadata field:

- `original-language`: ISO language code (zh-CN, ja-JP, ko-KR)

#### Supported Fields

Based on APA, MLA, and Chicago style requirements for CJK citations:

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
- WorldCat and other databases may provide English titles for CJK sources
- Preserves authoritative source data as a stable reference point

### Output Adaptation Layer

The plugin transforms the internal model for different output formats:

#### For LaTeX (Better BibTeX)

Exports to Better BibTeX syntax in the Extra field:

```
tex.titleaddon: 日本仏教綜合研究
tex.titleaddon-romanized: Nihon Bukkyō Sōgō Kenkyū
```

#### For Word/LibreOffice (CSL)

- Sets Zotero's Language field (e.g., `ja-JP`) to prevent incorrect English casing
- Provides or recommends CSL styles that support CJK citations
- May embed custom CSL styles if needed

## Features (Planned)

### Phase 1: Core Functionality
- ✅ Project setup and infrastructure
- [ ] Custom item pane section with UI for managing CJK fields
- [ ] Parse/generate Extra field with `cite-cjk.*` namespace
- [ ] Support for title, booktitle, author fields

### Phase 2: Better BibTeX Integration
- [ ] Export to Better BibTeX format
- [ ] Test with common LaTeX citation styles
- [ ] Documentation and examples for LaTeX workflow

### Phase 3: CSL Style Support
- [ ] Language field auto-configuration
- [ ] Test with Word/LibreOffice output
- [ ] Recommended CSL styles for CJK sources
- [ ] Optional: Embed custom CSL styles

### Phase 4: Advanced Features
- [ ] Batch operations (add CJK fields to multiple items)
- [ ] Import helpers for CJK databases (CNKI, CiNii, RISS)
- [ ] Romanization helpers (auto-generate pinyin/romaji)
- [ ] Validation and completeness warnings
- [ ] Multi-language UI (English, Chinese, Japanese, Korean)

## Installation

### Requirements

- Zotero 7 or later
- (Optional) [Better BibTeX](https://retorque.re/zotero-better-bibtex/) for LaTeX workflows

### Install from GitHub Releases

1. Download the latest `.xpi` file from [Releases](https://github.com/boan-anbo/cite-cjk/releases)
2. In Zotero, go to Tools → Add-ons
3. Click the gear icon, select "Install Add-on From File"
4. Select the downloaded `.xpi` file

### Manual Installation (Development)

See [Development Setup](#development-setup) below.

## Usage

### Basic Workflow

1. **Add CJK metadata to your items:**
   - Select an item in your Zotero library
   - Open the "Cite CJK" panel in the right sidebar (alongside Info, Notes, Tags, etc.)
   - Enter original, romanized, and English variants of titles and authors
   - Select the original language from the dropdown

2. **For LaTeX users:**
   - Export your library using Better BibTeX
   - The `titleaddon` and `booktitleaddon` fields will be populated automatically
   - Use with your preferred BibLaTeX styles

3. **For Word/LibreOffice users:**
   - Use recommended CJK-compatible CSL styles
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
git clone https://github.com/boan-anbo/cite-cjk.git
cd cite-cjk
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

- `origin`: Your fork at `https://github.com/boan-anbo/cite-cjk.git`
- `upstream`: Template at `https://github.com/windingwind/zotero-plugin-template.git`
- `upstream-template`: Local branch tracking `upstream/main`

## Contributing

Contributions are welcome! This project aims to be a long-term maintained solution for CJK citations.

### Areas for Contribution

- **Testing**: Test with real CJK sources across languages (Chinese, Japanese, Korean)
- **CSL styles**: Help identify or create CJK-compatible citation styles
- **Localization**: Translate UI strings to Chinese, Japanese, Korean
- **Documentation**: Improve guides and examples for different workflows
- **Feature requests**: Suggest fields or features based on your citation needs

### Development Guidelines

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Resources

### CJK Citation Guidelines

- [UBC Library: CJK Citation Guide](https://guides.library.ubc.ca/c.php?g=707463&p=5291936)
- [Yale: Citation Style for Chinese, Japanese and Korean Sources](https://guides.library.yale.edu/c.php?g=296262)
- [How to Easily Handle Non-English Citation Information in Zotero](https://jdavidstark.com/how-to-easily-handle-non-english-citation-information-in-zotero/)

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

- [Report issues](https://github.com/boan-anbo/cite-cjk/issues)
- [Discussions](https://github.com/boan-anbo/cite-cjk/discussions)

## Acknowledgments

- [windingwind](https://github.com/windingwind) for the excellent Zotero Plugin Template
- The Zotero team for creating an extensible research tool
- The CJK research community for feedback and requirements
