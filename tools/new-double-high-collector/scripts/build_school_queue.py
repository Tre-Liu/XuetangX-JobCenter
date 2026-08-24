#!/usr/bin/env python3
"""Build the pending school queue from a complete secondary list.

The output is deliberately marked pending. School inclusion, current name,
official domain, professional-group membership and group majors must still be
confirmed against official sources before any document is downloaded.
"""

import argparse
import csv
import urllib.request
from html.parser import HTMLParser
from pathlib import Path


SOURCE_URL = "https://www.99medic.com/elementor-1907/"


class TableParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.tables: list[list[list[str]]] = []
        self._table: list[list[str]] | None = None
        self._row: list[str] | None = None
        self._cell_parts: list[str] | None = None

    def handle_starttag(self, tag, _attrs):
        if tag == "table":
            self._table = []
        elif tag == "tr" and self._table is not None:
            self._row = []
        elif tag in {"td", "th"} and self._row is not None:
            self._cell_parts = []

    def handle_data(self, data):
        if self._cell_parts is not None:
            text = data.strip()
            if text:
                self._cell_parts.append(text)

    def handle_endtag(self, tag):
        if tag in {"td", "th"} and self._cell_parts is not None:
            assert self._row is not None
            self._row.append(" ".join(self._cell_parts))
            self._cell_parts = None
        elif tag == "tr" and self._row is not None:
            assert self._table is not None
            if self._row:
                self._table.append(self._row)
            self._row = None
        elif tag == "table" and self._table is not None:
            self.tables.append(self._table)
            self._table = None


def build_queue(output: Path) -> int:
    request = urllib.request.Request(
        SOURCE_URL,
        headers={"User-Agent": "RenpeiCollector/1.0 (+official vocational-education research)"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        html = response.read().decode("utf-8", errors="replace")
    parser = TableParser()
    parser.feed(html)
    table = next(
        rows
        for rows in parser.tables
        if rows and rows[0][:4] == ["序号", "省份", "学校名称", "布局类型"]
    )
    rows = [row for row in table[1:] if len(row) >= 4 and row[0].isdigit()]
    rows = rows[:220]
    if len(rows) != 220 or len({row[2] for row in rows}) != 220:
        raise ValueError("secondary school queue must contain 220 unique schools")
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.writer(stream)
        writer.writerow(
            [
                "queue_number",
                "institution_name",
                "province",
                "project_type",
                "list_source_url",
                "verification_status",
            ]
        )
        for number, province, institution_name, project_type, *_rest in rows:
            writer.writerow(
                [
                    number,
                    institution_name,
                    province,
                    project_type,
                    SOURCE_URL,
                    "school_list_pending_official_confirmation",
                ]
            )
    return len(rows)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    print(f"wrote {build_queue(args.output)} pending schools")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
