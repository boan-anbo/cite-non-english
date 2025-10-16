"""
Tally macro references in a CSL (Citation Style Language) XML file.

This script parses a CSL file, counts the number of times each macro is referenced, and displays a summary table. Unused macros are listed separately. The output is sorted by reference count (descending) and alphabetically for ties.
"""

import argparse
import logging
import sys
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path


def extract_macro_definitions(csl_path: Path) -> set[str]:
    """
    Extract all macro names defined in the CSL file using XML parsing.

    Args:
        csl_path (Path): Path to the CSL file.

    Returns:
        set[str]: Set of macro names defined in the file.
    """
    tree = ET.parse(csl_path)
    root = tree.getroot()
    return {
        str(macro.get("name"))
        for macro in root.findall(".//{http://purl.org/net/xbiblio/csl}macro")
        if macro.get("name")
    }


def tally_macro_references(csl_path: Path) -> Counter[str]:
    """
    Tally macro references in a CSL file using XML parsing.

    Args:
        csl_path (Path): Path to the CSL file.

    Returns:
        Counter[str]: Macro names mapped to their reference counts.
    """
    tree = ET.parse(csl_path)
    root = tree.getroot()
    counter: Counter[str] = Counter()
    for elem in root.iter():
        if macro_name := elem.attrib.get("macro"):
            counter[macro_name] += 1
    return counter


def display_macro_tally(
    macro_list: list[tuple[str, int]],
    total_macros: int,
    used_macros: int,
    unused_macros: list[str],
) -> None:
    """
    Display macro tally and summary statistics in a user-friendly format.
    """
    # Only show macros with references in the main tally
    referenced_macros: list[tuple[str, int]] = [
        (macro, count) for macro, count in macro_list if count > 0
    ]
    col_width: int = (
        max((len(macro) for macro, _ in referenced_macros), default=30) + 2
    )
    print("\nMacros with references")
    print(f"{'-' * (col_width + 7)}")
    for macro, count in referenced_macros:
        print(f"  {macro:<{col_width}} {count:>3}")
    if unused_macros:
        print("\nUnused macros")
        print(f"{'-' * (col_width + 7)}")
        for macro in unused_macros:
            print(f"  {macro}")
    print(f"\nTotal macros defined: {total_macros}")
    print(f"Macros used: {used_macros}")
    print(f"Macros unused: {len(unused_macros)}")


def main() -> int:
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "csl_file",
        type=Path,
        help="Path to the CSL file",
    )
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    logging.info(f"Processing CSL file: {args.csl_file}")

    if not args.csl_file.exists():
        logging.error(f"File not found: {args.csl_file}")
        print("Error: The specified CSL file does not exist.")
        return 1

    try:
        defined_macros = extract_macro_definitions(args.csl_file)
        macro_counts = tally_macro_references(args.csl_file)
    except Exception as exc:
        match exc:
            case ET.ParseError():
                logging.error(f"XML parsing error: {exc}")
                print(
                    "Error: Could not parse the CSL file. Please check that it is a valid CSL XML file."
                )
            case _:
                logging.error(f"Failed to process CSL file: {exc}")
                print(f"Error: Could not process the CSL file. Reason: {exc}")
        return 1

    all_macros = defined_macros | set(macro_counts.keys())
    macro_list: list[tuple[str, int]] = [
        (macro, macro_counts.get(macro, 0)) for macro in all_macros
    ]
    macro_list.sort(key=lambda x: (-x[1], x[0].lower()))

    total_macros: int = len(all_macros)
    used_macros: int = sum(1 for _, count in macro_list if count > 0)
    unused_macros: list[str] = [
        macro for macro, count in macro_list if count == 0
    ]

    display_macro_tally(macro_list, total_macros, used_macros, unused_macros)
    return 0


if __name__ == "__main__":
    sys.exit(main())
