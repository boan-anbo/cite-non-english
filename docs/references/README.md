# Reference Materials

This folder contains reference documentation and external resources that inform the design and implementation of the CNE Citation plugin.

## Contents

### Zotero Documentation

- **[zotero-title-casing.md](./zotero-title-casing.md)** - How Zotero handles title casing for non-English titles and the importance of the language field

### Planned References

The following reference materials should be added as we continue development:

#### Better BibTeX
- How Better BibTeX handles CNE citations
- CSL JSON export format for CNE fields
- Extra field conventions and best practices

#### CSS & Styling
- Zotero 7 CSS architecture
- XUL to HTML migration patterns
- Native component styling guidelines

#### Citation Standards
- Chicago Manual of Style guidelines for CNE citations
- APA style for non-English sources
- MLA format for foreign language materials

#### CNE-Specific
- Romanization systems (Pinyin, Wade-Giles, Romaji, etc.)
- Language code standards (ISO 639-1, BCP 47)
- Unicode handling best practices

## Adding New References

When adding a new reference document:

1. **Name it descriptively** - Use kebab-case (e.g., `better-bibtex-cjk.md`)
2. **Include the source URL** - Always cite where the information came from
3. **Date the reference** - Note when it was retrieved (documentation can change)
4. **Extract key points** - Focus on information relevant to our plugin
5. **Update this README** - Add a brief description of the new reference

## Purpose

These references serve multiple purposes:

- **Design decisions** - Understanding how Zotero and related tools work helps us make better architectural choices
- **Compatibility** - Ensures our plugin works well with existing Zotero workflows and plugins
- **Standards compliance** - Keeps us aligned with citation standards and best practices
- **Knowledge preservation** - Captures important information that might change or become unavailable

## External Links

Key external resources (not stored locally):

- [Zotero Developer Documentation](https://www.zotero.org/support/dev/zotero_7_for_developers)
- [Better BibTeX Documentation](https://retorque.re/zotero-better-bibtex/)
- [Citation Style Language](https://citationstyles.org/)
- [CSL GitHub Repository](https://github.com/citation-style-language)
