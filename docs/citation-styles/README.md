# Citation Style Guidelines: Non-English Sources

This directory contains **authoritative documentation** for citing non-English sources (particularly CJK languages) in major academic citation styles.

Each style has its own detailed markdown file serving as the **single source of truth** for CNE plugin implementation.

---

## Available Style Guides

### MLA (Modern Language Association)

| Style | Document | Official Source | Status |
|-------|----------|-----------------|--------|
| **MLA 8th Edition** | [MLA-8th-Edition.md](./MLA-8th-Edition.md) | [MLA Style Center](https://style.mla.org/nonroman-characters/) | ✅ Complete |
| **MLA 9th Edition** | [MLA-9th-Edition.md](./MLA-9th-Edition.md) | [MLA Handbook 9th](https://www.mla.org/Publications/Bookstore/Nonseries/MLA-Handbook-Ninth-Edition) | ✅ Complete |

### Chicago Manual of Style

| Style | Document | Official Source | Status |
|-------|----------|-----------------|--------|
| **Chicago 18th Edition** | *TBD* | [CMOS Online](https://www.chicagomanualofstyle.org/) | 🔲 Planned |

### APA (American Psychological Association)

| Style | Document | Official Source | Status |
|-------|----------|-----------------|--------|
| **APA 7th Edition** | *TBD* | [APA Style](https://apastyle.apa.org/) | 🔲 Planned |

---

## Document Structure

Each style guide follows this structure:

### 1. Core Principles
- Three-element format (Original Script + Transliteration + Translation)
- Rationale and philosophy

### 2. Works Cited/Reference List Format
- Order of elements
- Special cases (names, publishers)
- Complete citation examples

### 3. CJK-Specific Rules
- Name formatting (comma vs no-comma)
- Order conventions
- Language-specific examples

### 4. Alphabetization Rules
- Same-language entries
- Mixed-language entries

### 5. In-Text Citations
- Presentation variations
- Context-appropriate ordering

### 6. Implementation Notes
- Punctuation details
- Italics and formatting
- Multiple authors/contributors

### 7. Style Comparison
- Cross-reference with other major styles
- Key differences highlighted

### 8. References
- Official sources
- Secondary sources (Yale, etc.)
- Implementation status

---

## Quick Comparison: CJK Name Formatting

| Style | Chinese | Japanese | Korean | Comma? |
|-------|---------|----------|--------|--------|
| **MLA 8th/9th** | `Hao Chunwen 郝春文` | `Abe Yoshio 阿部善雄` | `Kang U-bang 姜友邦` | ✗ No |
| **Chicago 18th** | `Hao Chunwen 郝春文` | `Abe Yoshio 阿部善雄` | `Kang U-bang 姜友邦` | ✗ No |
| **APA 7th** | `Hao, C.` | `Abe, Y.` | `Kang, U.` | ✓ Yes |

---

## Quick Comparison: Script Display

| Style | Author Name | Title | Translation |
|-------|-------------|-------|-------------|
| **MLA** | ✓ Romanized + Original | ✓ Romanized + Original | ✓ [English] |
| **Chicago** | ✓ Romanized + Original | ✓ Romanized + Original | ✓ [English] |
| **APA** | ✓ Romanized only | ✓ Romanized only | ✓ [English] |

---

## Usage Guidelines

### For Developers

1. **Read the specific style guide** before implementing any citation logic
2. **Cite examples** from the style guide when making design decisions
3. **Update test expectations** to match the documented format exactly
4. **Reference the document** in code comments when implementing style-specific behavior

### For Researchers

1. **Check your discipline's preferred style** (MLA for humanities, APA for social sciences, Chicago for history/publishing)
2. **Follow the examples exactly** - citation formatting is highly standardized
3. **Use all three elements** (Original + Romanized + Translation) when available
4. **Respect name order conventions** - no comma for CJK names in MLA/Chicago

### For Contributors

When adding or updating style guides:

1. **Create a new markdown file** named `[Style-Name]-[Edition].md`
2. **Include official sources** with full URLs
3. **Provide complete examples** for each item type (book, article, film, etc.)
4. **Document differences** from other styles
5. **Note implementation status** in CNE plugin
6. **Update this README** to link to the new guide

---

## Key Insights Across Styles

### Universal Principles

1. **Original script shows respect** - Including native writing systems honors the source language
2. **Transliteration aids discovery** - Romanization helps readers find sources online
3. **Translation enables comprehension** - English meanings help non-specialist readers
4. **Name order matters** - Follow the natural order of the source language

### Common Pitfalls

❌ **Don't** add commas after CJK surnames in MLA/Chicago
❌ **Don't** omit original script when it's available
❌ **Don't** forget square brackets around translations
❌ **Don't** italicize original script (italics only on romanized titles)

✅ **Do** use all three elements (original, romanized, translation)
✅ **Do** follow surname-first order for CJK names
✅ **Do** check the specific style guide for your discipline
✅ **Do** maintain consistency throughout your bibliography

---

## Contributing

To add a new style guide:

```bash
# 1. Create the markdown file
touch docs/citation-styles/[Style-Name]-[Edition].md

# 2. Follow the established structure (see MLA files as templates)

# 3. Update this README with the new entry

# 4. Submit a pull request with:
   - The new style guide markdown
   - Updated README
   - Example test fixtures (if applicable)
```

---

## References

### Primary Sources
- MLA Style Center: https://style.mla.org/
- Chicago Manual of Style: https://www.chicagomanualofstyle.org/
- APA Style: https://apastyle.apa.org/

### Secondary Sources
- Yale University Library Citation Guides: https://guides.library.yale.edu/
- Library of Congress Romanization Tables: https://www.loc.gov/catdir/cpso/roman.html

---

**Last Updated:** 2025-10-22
**Maintainer:** CNE Plugin Development Team
**License:** CC BY 4.0 (Documentation)
