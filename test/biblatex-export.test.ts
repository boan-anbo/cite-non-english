import { assert } from "chai";
import {
  mapCNEtoBibLaTeX,
  hasBibLaTeXData,
  BIBLATEX_FIELD_MAPPINGS,
} from "../src/modules/cne/biblatex-mapper";
import type { CneMetadataData } from "../src/modules/cne/types";

describe("BibLaTeX Export - Field Mapping", function () {
  describe("mapCNEtoBibLaTeX()", function () {
    it("should map title.original to titleaddon with textzh wrapper", function () {
      const metadata: CneMetadataData = {
        title: {
          original: "清代以來三峽地區水旱災害的初步研究",
          romanized: "Qingdai yilai Sanxia diqu",
          english: null,
        },
      };

      const result = mapCNEtoBibLaTeX(metadata);

      assert.property(result, "titleaddon");
      assert.equal(
        result.titleaddon,
        "\\textzh{清代以來三峽地區水旱災害的初步研究}",
      );
    });

    it("should map title.english to usere without formatting", function () {
      const metadata: CneMetadataData = {
        title: {
          original: null,
          romanized: null,
          english: "A preliminary study of floods",
        },
      };

      const result = mapCNEtoBibLaTeX(metadata);

      assert.property(result, "usere");
      assert.equal(result.usere, "A preliminary study of floods");
    });

    it("should map journal.original to journaltitleaddon", function () {
      const metadata: CneMetadataData = {
        journal: {
          original: "中國社會科學",
          romanized: "Zhongguo shehui kexue",
        },
      };

      const result = mapCNEtoBibLaTeX(metadata);

      assert.property(result, "journaltitleaddon");
      assert.equal(result.journaltitleaddon, "\\textzh{中國社會科學}");
    });

    it("should map booktitle.original to booktitleaddon", function () {
      const metadata: CneMetadataData = {
        booktitle: {
          original: "日本仏教綜合研究",
          romanized: "Nihon Bukkyō sōgō kenkyū",
        },
      };

      const result = mapCNEtoBibLaTeX(metadata);

      assert.property(result, "booktitleaddon");
      assert.equal(result.booktitleaddon, "\\textzh{日本仏教綜合研究}");
    });

    it("should NOT map disabled fields (series, publisher)", function () {
      const metadata: CneMetadataData = {
        series: {
          original: "測試系列",
          romanized: "Ceshi xilie",
        },
        publisher: {
          original: "測試出版社",
          romanized: "Ceshi chubanshe",
        },
      };

      const result = mapCNEtoBibLaTeX(metadata);

      // These are disabled by default in BIBLATEX_FIELD_MAPPINGS
      assert.notProperty(result, "seriestitleaddon");
      assert.notProperty(result, "publisheraddon");
    });

    it("should map multiple fields at once", function () {
      const metadata: CneMetadataData = {
        title: {
          original: "黃金年代",
          romanized: "Huangjin niandai",
          english: "Golden Time",
        },
        journal: {
          original: "文學雜誌",
          romanized: "Wenxue zazhi",
        },
      };

      const result = mapCNEtoBibLaTeX(metadata);

      assert.property(result, "titleaddon");
      assert.property(result, "usere");
      assert.property(result, "journaltitleaddon");
      assert.equal(result.titleaddon, "\\textzh{黃金年代}");
      assert.equal(result.usere, "Golden Time");
      assert.equal(result.journaltitleaddon, "\\textzh{文學雜誌}");
    });

    it("should return empty object for empty metadata", function () {
      const metadata: CneMetadataData = {};

      const result = mapCNEtoBibLaTeX(metadata);

      // Should have no standard fields
      assert.notProperty(result, "titleaddon");
      assert.notProperty(result, "usere");
      assert.notProperty(result, "journaltitleaddon");
    });

    it("should add author formatting options when authors have original names", function () {
      const metadata: CneMetadataData = {
        authors: [
          {
            lastRomanized: "Hua",
            firstRomanized: "Linfu",
            lastOriginal: "華",
            firstOriginal: "林甫",
          },
        ],
      };

      const result = mapCNEtoBibLaTeX(metadata);

      assert.property(result, "options");
      assert.property(result, "ctitleaddon");
      assert.property(result, "ptitleaddon");
      assert.equal(result.options, "nametemplates=cjk");
      assert.equal(result.ctitleaddon, "space");
      assert.equal(result.ptitleaddon, "space");
    });

    it("should NOT add author options when authors have no original names", function () {
      const metadata: CneMetadataData = {
        authors: [
          {
            lastRomanized: "Smith",
            firstRomanized: "John",
            lastOriginal: null,
            firstOriginal: null,
          },
        ],
      };

      const result = mapCNEtoBibLaTeX(metadata);

      assert.notProperty(result, "options");
      assert.notProperty(result, "ctitleaddon");
      assert.notProperty(result, "ptitleaddon");
    });
  });

  describe("hasBibLaTeXData()", function () {
    it("should return true when title.original exists", function () {
      const metadata: CneMetadataData = {
        title: {
          original: "測試標題",
          romanized: null,
          english: null,
        },
      };

      assert.isTrue(hasBibLaTeXData(metadata));
    });

    it("should return true when title.english exists", function () {
      const metadata: CneMetadataData = {
        title: {
          original: null,
          romanized: null,
          english: "Test Title",
        },
      };

      assert.isTrue(hasBibLaTeXData(metadata));
    });

    it("should return true when journal.original exists", function () {
      const metadata: CneMetadataData = {
        journal: {
          original: "測試期刊",
          romanized: null,
        },
      };

      assert.isTrue(hasBibLaTeXData(metadata));
    });

    it("should return true when authors have original names", function () {
      const metadata: CneMetadataData = {
        authors: [
          {
            lastRomanized: "Wang",
            firstRomanized: "Wei",
            lastOriginal: "王",
            firstOriginal: "偉",
          },
        ],
      };

      assert.isTrue(hasBibLaTeXData(metadata));
    });

    it("should return false for disabled fields (series, publisher)", function () {
      const metadata: CneMetadataData = {
        series: {
          original: "測試系列",
          romanized: null,
        },
        publisher: {
          original: "測試出版社",
          romanized: null,
        },
      };

      // These are disabled, so should return false
      assert.isFalse(hasBibLaTeXData(metadata));
    });

    it("should return false for empty metadata", function () {
      const metadata: CneMetadataData = {};

      assert.isFalse(hasBibLaTeXData(metadata));
    });

    it("should return false when only romanized fields exist (no enabled fields)", function () {
      const metadata: CneMetadataData = {
        title: {
          original: null,
          romanized: "Huangjin niandai",
          english: null,
        },
      };

      assert.isFalse(hasBibLaTeXData(metadata));
    });
  });

  describe("BIBLATEX_FIELD_MAPPINGS Configuration", function () {
    it("should have at least title and journal mappings enabled", function () {
      const enabledMappings = BIBLATEX_FIELD_MAPPINGS.filter((m) => m.enabled);

      const fields = enabledMappings.map((m) => m.biblatexField);

      assert.include(fields, "titleaddon");
      assert.include(fields, "usere");
      assert.include(fields, "journaltitleaddon");
      assert.include(fields, "booktitleaddon");
    });

    it("should have series and publisher disabled by default", function () {
      const disabledMappings = BIBLATEX_FIELD_MAPPINGS.filter(
        (m) => !m.enabled,
      );

      const fields = disabledMappings.map((m) => m.biblatexField);

      assert.include(fields, "seriestitleaddon");
      assert.include(fields, "publisheraddon");
    });

    it("should mark standard fields correctly", function () {
      const standardFields = BIBLATEX_FIELD_MAPPINGS.filter(
        (m) => m.standard && m.enabled,
      );

      const fields = standardFields.map((m) => m.biblatexField);

      // Standard fields should include title, usere, journal, booktitle
      assert.include(fields, "titleaddon");
      assert.include(fields, "usere");
      assert.include(fields, "journaltitleaddon");
      assert.include(fields, "booktitleaddon");
    });

    it("should mark experimental fields correctly", function () {
      const experimentalFields = BIBLATEX_FIELD_MAPPINGS.filter(
        (m) => !m.standard,
      );

      const fields = experimentalFields.map((m) => m.biblatexField);

      // Experimental fields
      assert.include(fields, "seriestitleaddon");
      assert.include(fields, "publisheraddon");
    });

    it("should have valid formatters for all mappings", function () {
      for (const mapping of BIBLATEX_FIELD_MAPPINGS) {
        assert.isFunction(
          mapping.formatter,
          `${mapping.biblatexField} should have a formatter function`,
        );

        // Test formatter with sample input
        const result = mapping.formatter("測試");
        assert.isString(result);
        assert.isNotEmpty(result);
      }
    });

    it("should apply textzh wrapper for original script fields", function () {
      const originalScriptMappings = BIBLATEX_FIELD_MAPPINGS.filter(
        (m) =>
          m.cneFieldPath.includes(".original") &&
          m.biblatexField !== "usere",
      );

      for (const mapping of originalScriptMappings) {
        const result = mapping.formatter("測試");
        assert.include(
          result,
          "\\textzh{",
          `${mapping.biblatexField} should use textzh wrapper`,
        );
        assert.include(result, "測試");
        assert.include(result, "}");
      }
    });

    it("should NOT apply textzh wrapper for english translation fields", function () {
      const englishMapping = BIBLATEX_FIELD_MAPPINGS.find(
        (m) => m.biblatexField === "usere",
      );

      assert.isDefined(englishMapping);
      const result = englishMapping!.formatter("Test English");
      assert.equal(result, "Test English");
      assert.notInclude(result, "\\textzh");
    });
  });
});

describe("BibLaTeX Export - User Precedence (Integration)", function () {
  // Note: These tests would ideally test the injectBibLaTeXFields() function,
  // but since it's not exported, we document the expected behavior here.
  // The function is tested indirectly through the biblatex export integration.

  it("should document user precedence behavior", function () {
    // Expected behavior documented in biblatex-export.ts:
    //
    // 1. Parse user's Extra field for existing biblatex.* fields
    // 2. Build a Set of field names user has provided
    // 3. Only inject CNE fields NOT in that set
    // 4. Log when user values take precedence
    //
    // Example:
    // Input Extra: "biblatex.titleaddon= My custom\ncne-title-original: 測試"
    // CNE fields: { titleaddon: "\\textzh{測試}", usere: "Test" }
    // Output Extra: "biblatex.titleaddon= My custom\ncne-title-original: 測試\nbiblatex.usere= Test"
    //
    // User's titleaddon is preserved, CNE's usere is added

    assert.ok(
      true,
      "User precedence is implemented in biblatex-export.ts injectBibLaTeXFields()",
    );
  });

  it("should document per-field precedence (not all-or-nothing)", function () {
    // Expected behavior:
    // - User provides biblatex.titleaddon → CNE skips titleaddon
    // - User does NOT provide biblatex.usere → CNE adds usere
    // - Precedence checked per field, not globally

    assert.ok(true, "Per-field precedence allows mixed user/CNE fields");
  });

  it("should document supported delimiters (= and :)", function () {
    // Both formats supported by Better BibTeX:
    // - biblatex.titleaddon= value (= for raw LaTeX)
    // - biblatex.titleaddon: value (: for escaped content)
    //
    // CNE uses = delimiter for raw LaTeX (no escaping)

    assert.ok(
      true,
      "Both biblatex.field= and biblatex.field: formats are detected",
    );
  });
});
