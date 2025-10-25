### Minimal prompt: Export Zotero PDF annotation comments (macOS)

- **Goal**: Read-only export of all PDF annotation comments to a TSV on Desktop.
- **Output**: `~/Desktop/zotero-comments.tsv` (tab-separated with header).

```bash
set -euo pipefail

# 1) Locate Zotero DB (stable, beta, fallback search)
DB="$(ls -t "$HOME/Library/Application Support/Zotero/Profiles"/*/zotero.sqlite "$HOME/Library/Application Support/Zotero-Beta/Profiles"/*/zotero.sqlite "$HOME/Zotero/zotero.sqlite" 2>/dev/null | head -n1 || true)"
[ -n "${DB:-}" ] || DB="$(find "$HOME/Library/Application Support" "$HOME/Zotero" -type f -name zotero.sqlite 2>/dev/null | head -n1 || true)"
[ -f "$DB" ] || { echo "Zotero database not found"; exit 1; }

OUT="$HOME/Desktop/zotero-comments.tsv"

# 2) Check JSON1 support (for pageIndex)
if sqlite3 -readonly "$DB" "SELECT json_extract('{\"i\":3}','$.i');" >/dev/null 2>&1; then JSON=1; else JSON=0; fi

# 3) Export comments (only annotations that actually have comment text)
if [ "$JSON" = "1" ]; then
sqlite3 -readonly -cmd ".mode tabs" -cmd ".headers on" "$DB" "
WITH parent_title AS (
  SELECT d.itemID, v.value AS title
  FROM itemData d
  JOIN itemDataValues v ON v.valueID=d.valueID
  JOIN fields f ON f.fieldID=d.fieldID
  WHERE f.fieldName='title'
),
parent_creators AS (
  SELECT itemID, GROUP_CONCAT(name, '; ') AS creators
  FROM (
    SELECT ic.itemID, ic.orderIndex,
           TRIM(c.lastName || CASE WHEN c.firstName IS NOT NULL AND c.firstName!='' THEN ', '||c.firstName ELSE '' END) AS name
    FROM itemCreators ic
    JOIN creators c ON c.creatorID = ic.creatorID
    ORDER BY ic.itemID, ic.orderIndex
  ) s
  GROUP BY itemID
),
base AS (
  SELECT
    pi.key AS parentKey,
    pi.itemID AS parentItemID,
    ai.itemID AS annotationItemID,
    ai.dateAdded AS annotationDate,
    pt.title AS parentTitle,
    pc.creators AS parentCreators,
    at.path AS pdfPath,
    ia.pageLabel AS pageLabel,
    json_extract(ia.position, '$.pageIndex') AS pageIndex,
    ia.color AS color,
    CASE WHEN ia.type=1 THEN 'highlight' WHEN ia.type=2 THEN 'note' ELSE CAST(ia.type AS TEXT) END AS annotationType,
    ia.text AS highlightText,
    CASE
      WHEN ia.type=2 THEN COALESCE(NULLIF(TRIM(ia.comment),''), NULLIF(TRIM(ia.text),''))
      ELSE NULLIF(TRIM(ia.comment),'')
    END AS commentText,
    ia.sortIndex AS sortIndex
  FROM itemAnnotations ia
  JOIN items ai ON ai.itemID=ia.itemID
  JOIN itemAttachments at ON at.itemID=ia.parentItemID AND at.contentType='application/pdf'
  JOIN items pi ON pi.itemID=at.parentItemID
  LEFT JOIN parent_title pt ON pt.itemID=pi.itemID
  LEFT JOIN parent_creators pc ON pc.itemID=pi.itemID
  WHERE ia.isExternal=0
)
SELECT parentKey, parentItemID, annotationItemID, annotationDate,
       parentTitle, parentCreators, pdfPath, pageLabel, pageIndex,
       color, annotationType, highlightText, commentText
FROM base
WHERE commentText IS NOT NULL
ORDER BY parentItemID, annotationDate, sortIndex;
" > "$OUT"
else
sqlite3 -readonly -cmd ".mode tabs" -cmd ".headers on" "$DB" "
WITH parent_title AS (
  SELECT d.itemID, v.value AS title
  FROM itemData d
  JOIN itemDataValues v ON v.valueID=d.valueID
  JOIN fields f ON f.fieldID=d.fieldID
  WHERE f.fieldName='title'
),
parent_creators AS (
  SELECT itemID, GROUP_CONCAT(name, '; ') AS creators
  FROM (
    SELECT ic.itemID, ic.orderIndex,
           TRIM(c.lastName || CASE WHEN c.firstName IS NOT NULL AND c.firstName!='' THEN ', '||c.firstName ELSE '' END) AS name
    FROM itemCreators ic
    JOIN creators c ON c.creatorID = ic.creatorID
    ORDER BY ic.itemID, ic.orderIndex
  ) s
  GROUP BY itemID
),
base AS (
  SELECT
    pi.key AS parentKey,
    pi.itemID AS parentItemID,
    ai.itemID AS annotationItemID,
    ai.dateAdded AS annotationDate,
    pt.title AS parentTitle,
    pc.creators AS parentCreators,
    at.path AS pdfPath,
    ia.pageLabel AS pageLabel,
    NULL AS pageIndex,
    ia.color AS color,
    CASE WHEN ia.type=1 THEN 'highlight' WHEN ia.type=2 THEN 'note' ELSE CAST(ia.type AS TEXT) END AS annotationType,
    ia.text AS highlightText,
    CASE
      WHEN ia.type=2 THEN COALESCE(NULLIF(TRIM(ia.comment),''), NULLIF(TRIM(ia.text),''))
      ELSE NULLIF(TRIM(ia.comment),'')
    END AS commentText,
    ia.sortIndex AS sortIndex
  FROM itemAnnotations ia
  JOIN items ai ON ai.itemID=ia.itemID
  JOIN itemAttachments at ON at.itemID=ia.parentItemID AND at.contentType='application/pdf'
  JOIN items pi ON pi.itemID=at.parentItemID
  LEFT JOIN parent_title pt ON pt.itemID=pi.itemID
  LEFT JOIN parent_creators pc ON pc.itemID=pi.itemID
  WHERE ia.isExternal=0
)
SELECT parentKey, parentItemID, annotationItemID, annotationDate,
       parentTitle, parentCreators, pdfPath, pageLabel, pageIndex,
       color, annotationType, highlightText, commentText
FROM base
WHERE commentText IS NOT NULL
ORDER BY parentItemID, annotationDate, sortIndex;
" > "$OUT"
fi

echo "Saved: $OUT"
wc -l "$OUT" || true
```

