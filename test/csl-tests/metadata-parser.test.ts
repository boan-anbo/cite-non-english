import { assert } from "chai";
import {
  parseCNEMetadata,
  serializeToExtra,
} from "../../src/modules/cne/metadata-parser";

describe("CNE metadata parser", function () {
  it("parses canonical hyphenated short romanized title fields", function () {
    const metadata = parseCNEMetadata(
      "cne-title-romanized-short: Jindai Shandong kaibu",
    );

    assert.equal(metadata.title?.romanizedShort, "Jindai Shandong kaibu");
  });

  it("keeps legacy camelCase short romanized title fields readable", function () {
    const metadata = parseCNEMetadata(
      "cne-title-romanizedShort: Jindai Shandong kaibu",
    );

    assert.equal(metadata.title?.romanizedShort, "Jindai Shandong kaibu");
  });

  it("serializes short romanized title fields in canonical hyphenated form", function () {
    const extra = serializeToExtra("", {
      title: {
        romanizedShort: "Jindai Shandong kaibu",
      },
    });

    assert.equal(extra, "cne-title-romanized-short: Jindai Shandong kaibu");
  });
});
