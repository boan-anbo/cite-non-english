"""
Remove unused macros from a CSL file.
"""

import argparse
import logging
import re
import sys
from copy import deepcopy
from dataclasses import dataclass, field
from pathlib import Path

from lxml import etree

logging.basicConfig(level=logging.INFO, format="%(message)s")
NS = "{http://purl.org/net/xbiblio/csl}"


@dataclass(slots=True)
class CSLPruner:
    input_path: Path
    output_path: Path
    tree: etree._ElementTree | None = field(default=None, init=False)
    root: etree._Element | None = field(default=None, init=False)
    macro_defs: dict[str, etree._Element] = field(
        default_factory=dict, init=False
    )
    parent_map: dict[etree._Element, etree._Element] = field(
        default_factory=dict, init=False
    )
    modified: bool = field(
        default=False, init=False
    )  # Track whether changes have been made

    def parse_xml(self) -> None:
        try:
            self.tree = etree.parse(self.input_path)
            if self.tree is None:
                raise ValueError("Parsed XML tree is None.")
            self.root = self.tree.getroot()
        except Exception as e:
            logging.error(
                "Unable to parse the XML file. Please ensure the file is valid XML.",
                exc_info=True,
            )
            raise e
        if self.root is None:
            msg = "The XML file appears to be empty or malformed. Please verify its contents."
            logging.error(msg)
            raise ValueError(msg)
        self.build_parent_map()
        self.collect_macro_definitions()

    def build_parent_map(self) -> None:
        """Build a mapping from each node to its parent for removal operations."""
        if self.root is None:
            msg = "XML structure missing: the root element could not be found. Please check the input file."
            logging.error(msg)
            raise ValueError(msg)
        self.parent_map = {}
        for element in self.root.iter():
            for child in element:
                self.parent_map[child] = element

    def collect_macro_definitions(self) -> None:
        """Collect <macro> elements keyed on their 'name' attribute."""
        if self.root is None:
            msg = "Cannot collect macros because the XML root is missing. Ensure the file has valid XML content."
            logging.error(msg)
            raise ValueError(msg)
        self.macro_defs = {}
        for elem in self.root.iter(f"{NS}macro"):
            name = elem.attrib.get("name")
            if name:
                self.macro_defs[name] = elem

    def flatten_layout_macros(self) -> int:
        """Flatten layout macro wrappers.

        If a <layout> has exactly one child, and that child is a <text> element
        with only a macro attribute (no other attributes), replace that child
        with the body (children) of the referenced macro. This simplifies the
        tree so that wrapper macros can be pruned subsequently.

        Returns the number of <layout> nodes updated.
        """
        if self.root is None:
            msg = "Root is None. Ensure parse_xml() is called successfully."
            logging.error(msg)
            raise ValueError(msg)

        updated = 0
        for layout in self.root.iter(f"{NS}layout"):
            # Consider only real element children, ignore comments/whitespace
            children = [ch for ch in list(layout) if isinstance(ch.tag, str)]
            if len(children) != 1:
                continue
            only_child = children[0]
            if only_child.tag != f"{NS}text":
                continue

            # Require a pure macro call to avoid changing semantics if other attributes exist
            # Build a concrete dict[str, str] of attributes for type safety
            attrs: dict[str, str] = {
                str(k): str(v) for k, v in only_child.attrib.items()
            }
            macro_attr = attrs.get("macro")
            # Ensure the attribute is a string (lxml can expose AnyStr)
            if not isinstance(macro_attr, str):
                continue
            macro_name: str = macro_attr
            if not macro_name or len(attrs) != 1:
                continue

            macro_def = self.macro_defs.get(macro_name)
            if macro_def is None:
                # Unknown macro; skip
                continue

            # Replace the <text macro="..."/> with the macro's child nodes
            for ch in list(layout):
                layout.remove(ch)
            for sub in list(macro_def):
                layout.append(deepcopy(sub))

            updated += 1

        if updated:
            self.modified = True
            # Tree structure changed; rebuild parent map for subsequent operations
            self.build_parent_map()
        return updated

    def gather_macro_refs(self, element: etree._Element) -> set:
        """Recursively collect macro names to which the element refers."""
        refs = set()
        macro_attr = element.attrib.get("macro")
        if macro_attr:
            refs.add(macro_attr)
        for child in element:
            refs.update(self.gather_macro_refs(child))
        return refs

    def build_used_macros(self) -> set:
        if self.root is None:
            msg = "Root is None. Ensure parse_xml() is called successfully."
            logging.error(msg)
            raise ValueError(msg)
        used_macros = set()

        def add_macro_and_deps(macro_name: str) -> None:
            if macro_name in used_macros:
                return
            used_macros.add(macro_name)
            macro = self.macro_defs.get(macro_name)
            if macro is not None:
                refs = self.gather_macro_refs(macro)
                for ref in refs:
                    add_macro_and_deps(ref)

        # Entry points: <citation> and <bibliography>
        entry_tags = [f"{NS}citation", f"{NS}bibliography"]
        entry_macro_refs = set()
        for tag in entry_tags:
            for entry in self.root.iter(tag):
                entry_macro_refs.update(self.gather_macro_refs(entry))
        entry_macro_refs.update(self.gather_macro_refs(self.root))
        for ref in entry_macro_refs:
            add_macro_and_deps(ref)
        return used_macros

    def prune_macros(self) -> None:
        total_removed = []
        while True:
            used_macros = self.build_used_macros()
            removed = []
            for name, macro in list(self.macro_defs.items()):
                if name not in used_macros:
                    parent = self.parent_map.get(macro, macro.getparent())
                    if parent is not None:
                        parent.remove(macro)
                        removed.append(name)
                        logging.debug(f"Removed macro: {name}")
            if removed:
                self.modified = True
                total_removed.extend(removed)
                self.collect_macro_definitions()
                self.build_parent_map()
            else:
                logging.debug("No unused macros found.")
                break
        if total_removed:
            logging.info(
                f"Removed a total of {len(total_removed)} unused macros."
            )
        else:
            logging.info("No macros pruned.")

    def remove_xml_model_declarations(self, xml_data: str) -> str:
        """Remove any xml-model declarations from the XML content."""
        return re.sub(r"<\?xml-model [^>]+>\n?", "", xml_data)

    def normalize_xml_content(self, xml_data: bytes) -> bytes:
        """Revert Python changes to XML content and reorder the default-locale attribute in <style> tags."""
        text = xml_data.decode("utf-8")
        text = self.remove_xml_model_declarations(text)
        text = re.sub(
            r"<\?xml version='1\.0' encoding='utf-8'\?>",
            '<?xml version="1.0" encoding="utf-8"?>',
            text,
        )
        text = re.sub(r"—+", lambda m: "&#8212;" * len(m.group(0)), text)

        # Collapse XML fragments inside multi-line comments to match CSL repository indentation
        # Pattern captures the entire comment body (non-greedy) so we can post-process line breaks
        comment_pattern = re.compile(r"<!--(.*?)-->", re.DOTALL)

        def collapse_comment(match: re.Match) -> str:
            body = match.group(1)
            # Quick exit if no newline (single-line comment)
            if "\n" not in body:
                return f"<!--{body}-->"
            lines = body.split("\n")
            tag_line_regex = re.compile(r"^[ \t]*<[^>]+>[ \t]*$")
            new_lines: list[str] = []
            i = 0
            while i < len(lines):
                if tag_line_regex.match(lines[i]):
                    # Gather consecutive tag-only lines
                    seq: list[str] = []
                    while i < len(lines) and tag_line_regex.match(lines[i]):
                        seq.append(lines[i])
                        i += 1
                    # Collapse sequence
                    first_indent_match = re.match(r"^([ \t]*)", seq[0])
                    indent = (
                        first_indent_match.group(1)
                        if first_indent_match
                        else ""
                    )
                    collapsed = indent + "".join(s.strip() for s in seq)
                    new_lines.append(collapsed)
                else:
                    new_lines.append(lines[i])
                    i += 1
            collapsed_body = "\n".join(new_lines)
            return f"<!--{collapsed_body}-->"

        text = comment_pattern.sub(collapse_comment, text)

        # Reorder the default-locale attribute to the end in <style ...> tags.
        def reorder_default_locale(match: re.Match) -> str:
            attribs = match.group(1)
            # Find all attributes in the tag.
            attrs = re.findall(r'(\S+="[^"]*")', attribs)
            new_attrs: list[str] = []
            default_locale_attr: str | None = None
            for attr in attrs:
                if attr.startswith("default-locale="):
                    default_locale_attr = attr
                else:
                    new_attrs.append(attr)
            if default_locale_attr is not None:
                new_attrs.append(default_locale_attr)
            new_attribs = " ".join(new_attrs)
            return f"<style {new_attribs}>"

        text = re.sub(r"<style\s+([^>]+)>", reorder_default_locale, text)
        return text.encode("utf-8")

    def reindent_xml_bytes(self, xml_data: bytes) -> bytes:
        """Reindent the XML by stripping blank text nodes and pretty-printing.

        This should be applied as a final structural formatter to ensure
        consistent indentation after all tree edits and notice insertion.
        """
        try:
            parser = etree.XMLParser(remove_blank_text=True)
            root = etree.fromstring(xml_data, parser)
            new_tree = etree.ElementTree(root)
            return etree.tostring(
                new_tree,
                encoding="utf-8",
                xml_declaration=True,
                pretty_print=True,
            )
        except Exception:
            # If reindent fails for any reason, fall back to the original bytes
            logging.warning(
                "Reindent step failed; writing original formatted XML.",
                exc_info=True,
            )
            return xml_data

    def save(self) -> None:
        if self.tree is not None:
            try:
                xml_data = etree.tostring(
                    self.tree,
                    encoding="utf-8",
                    xml_declaration=True,
                    pretty_print=True,
                )
                # Normalize textual content, then reindent the entire file
                xml_data = self.normalize_xml_content(xml_data)
                xml_data = self.reindent_xml_bytes(xml_data)
                # Ensure XML declaration uses double quotes
                xml_text = xml_data.decode("utf-8")
                xml_text = re.sub(
                    r"<\?xml version='1\.0' encoding='utf-8'\?>",
                    '<?xml version="1.0" encoding="utf-8"?>',
                    xml_text,
                )
                # lxml will decode character entities during reparse; restore em-dashes as numeric entities
                xml_text = re.sub(
                    r"—+", lambda m: "&#8212;" * len(m.group(0)), xml_text
                )
                self.output_path.write_text(xml_text, encoding="utf-8")
            except Exception as e:
                logging.error(
                    "Failed to save the pruned XML file. Please ensure the output path is valid and writable.",
                    exc_info=True,
                )
                raise e
        else:
            msg = (
                "Cannot save file because the XML was not successfully loaded."
            )
            logging.error(msg)
            raise ValueError(msg)


def main() -> int:
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "input_path", type=Path, help="Path to the input CSL file."
    )
    parser.add_argument(
        "output_path", type=Path, help="Path to the output pruned CSL file."
    )
    args: argparse.Namespace = parser.parse_args()

    pruner = CSLPruner(args.input_path, args.output_path)
    try:
        pruner.parse_xml()
        # Inline trivial macro-only layouts so wrapper macros become removable
        pruner.flatten_layout_macros()
        pruner.prune_macros()
        pruner.save()
        if pruner.modified:
            logging.info(f"Pruned {args.output_path}")
        else:
            logging.info(f"No macros pruned in {args.input_path}")
        return 0
    except Exception:
        logging.error("An error occurred during processing.", exc_info=True)
        return 1


if __name__ == "__main__":
    sys.exit(main())
