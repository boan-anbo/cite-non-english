/** Map CSL's role-grouped arrays back to Zotero's ordered creator list. */
export function creatorPositions(item: Zotero.Item): Record<string, number[]> {
  const positions: Record<string, number[]> = {};
  const primaryID = Zotero.CreatorTypes.getPrimaryIDForType(item.itemTypeID);
  const primary = primaryID
    ? Zotero.CreatorTypes.getName(primaryID)
    : undefined;
  item.getCreators().forEach((creator, index) => {
    const type = Zotero.CreatorTypes.getName(creator.creatorTypeID);
    // Use Zotero's role mapping and its primary-role rule, as itemToCSLJSON does.
    const role =
      Zotero.Schema.CSL_NAME_MAPPINGS[type] ||
      (type === primary ? "author" : undefined);
    if (role) (positions[role] ??= []).push(index);
  });
  return positions;
}
