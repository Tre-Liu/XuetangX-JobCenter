from __future__ import annotations

import json
import re
import unicodedata
from collections import Counter
from pathlib import Path

import pandas as pd


CURRENT_PATH = Path("/Users/liuhongzhe/Desktop/edu_industry_industrial_map_unmatched_0825.csv")
PREVIOUS_PATH = Path("/Users/liuhongzhe/Desktop/edu_industry_industrial_map_unmatched.csv")
SOURCE_XLSX_PATH = Path("/Users/liuhongzhe/Desktop/19条产业链全量细分环节与国民经济行业小类匹配表（新）.xlsx")

KEY_COLUMNS = ["chain_name", "industry_code", "industry_name", "line", "node_name"]
COMPARISON_KEY_COLUMNS = ["chain_name", "industry_code", "industry_name", "node_name"]


def load_csv(path: Path) -> pd.DataFrame:
    frame = pd.read_csv(path, dtype=str, encoding="utf-8-sig", keep_default_na=False)
    frame.columns = [str(column).strip() for column in frame.columns]
    for column in frame.columns:
        frame[column] = frame[column].astype(str)
    frame["csv_row"] = range(2, len(frame) + 2)
    frame["node_candidates_num"] = pd.to_numeric(frame["node_candidates"], errors="coerce")
    return frame


def normalize_text(value: str) -> str:
    text = unicodedata.normalize("NFKC", value or "")
    text = re.sub(r"\s+", "", text)
    text = text.replace("—", "-").replace("–", "-").replace("－", "-")
    text = text.replace("／", "/").replace("＆", "&")
    return text.casefold()


def profile(frame: pd.DataFrame) -> dict:
    blank_counts = {
        column: int(frame[column].astype(str).str.strip().eq("").sum())
        for column in ["chain_name", "industry_code", "industry_name", "line", "node_candidates", "node_name", "reason"]
    }
    return {
        "rows": int(len(frame)),
        "columns": int(len(frame.columns) - 2),
        "chains": int(frame["chain_name"].nunique()),
        "industry_codes": int(frame["industry_code"].nunique()),
        "industry_names": int(frame["industry_name"].nunique()),
        "node_names": int(frame["node_name"].nunique()),
        "blank_counts": blank_counts,
        "exact_duplicate_rows": int(frame.duplicated(subset=[c for c in frame.columns if c not in {"csv_row", "node_candidates_num"}]).sum()),
        "duplicate_business_keys": int(frame.duplicated(subset=KEY_COLUMNS, keep=False).sum()),
        "reason_counts": {str(k): int(v) for k, v in frame["reason"].value_counts().items()},
        "candidate_counts": {
            str(int(k)) if pd.notna(k) else "null": int(v)
            for k, v in frame["node_candidates_num"].value_counts(dropna=False).sort_index().items()
        },
        "line_min": int(pd.to_numeric(frame["line"], errors="coerce").min()),
        "line_max": int(pd.to_numeric(frame["line"], errors="coerce").max()),
    }


def top_records(series: pd.Series, n: int = 12) -> list[dict]:
    counts = series.value_counts().head(n)
    return [{"value": str(index), "rows": int(value)} for index, value in counts.items()]


def reason_summary(frame: pd.DataFrame) -> dict:
    output: dict[str, dict] = {}
    for reason, group in frame.groupby("reason", sort=False):
        output[str(reason)] = {
            "rows": int(len(group)),
            "share_of_unmatched": float(len(group) / len(frame)),
            "chains": int(group["chain_name"].nunique()),
            "node_names": int(group["node_name"].nunique()),
            "industry_codes": int(group["industry_code"].nunique()),
            "candidate_min": None if group["node_candidates_num"].isna().all() else int(group["node_candidates_num"].min()),
            "candidate_max": None if group["node_candidates_num"].isna().all() else int(group["node_candidates_num"].max()),
            "top_chains": top_records(group["chain_name"], 10),
            "top_nodes": top_records(group["node_name"], 15),
        }
    return output


def invariant_checks(frame: pd.DataFrame) -> dict:
    expected = {
        "node_not_found": lambda values: values.eq(0),
        "node_ambiguous": lambda values: values.gt(1),
    }
    checks = {}
    for reason, rule in expected.items():
        group = frame.loc[frame["reason"].eq(reason)]
        valid = rule(group["node_candidates_num"])
        checks[reason] = {
            "rows": int(len(group)),
            "consistent_rows": int(valid.sum()),
            "inconsistent_rows": int((~valid).sum()),
        }
    industry_group = frame.loc[frame["reason"].eq("industry_not_found")]
    checks["industry_not_found"] = {
        "rows": int(len(industry_group)),
        "candidate_distribution": {
            str(int(k)) if pd.notna(k) else "null": int(v)
            for k, v in industry_group["node_candidates_num"].value_counts(dropna=False).sort_index().items()
        },
    }
    return checks


def compare_runs(current: pd.DataFrame, previous: pd.DataFrame) -> dict:
    current_keys = current[COMPARISON_KEY_COLUMNS].astype(str).agg("\x1f".join, axis=1)
    previous_keys = previous[COMPARISON_KEY_COLUMNS].astype(str).agg("\x1f".join, axis=1)
    current_key_set = set(current_keys)
    previous_key_set = set(previous_keys)

    current_indexed = current.assign(_key=current_keys).set_index("_key", drop=False)
    previous_indexed = previous.assign(_key=previous_keys).set_index("_key", drop=False)
    shared_keys = sorted(current_key_set & previous_key_set)

    transitions = Counter()
    candidate_deltas = Counter()
    for key in shared_keys:
        current_row = current_indexed.loc[key]
        previous_row = previous_indexed.loc[key]
        if isinstance(current_row, pd.DataFrame) or isinstance(previous_row, pd.DataFrame):
            continue
        transitions[(previous_row["reason"], current_row["reason"])] += 1
        old_candidates = pd.to_numeric(pd.Series([previous_row["node_candidates"]]), errors="coerce").iloc[0]
        new_candidates = pd.to_numeric(pd.Series([current_row["node_candidates"]]), errors="coerce").iloc[0]
        if pd.notna(old_candidates) and pd.notna(new_candidates):
            candidate_deltas[int(new_candidates - old_candidates)] += 1

    return {
        "previous_unmatched": int(len(previous)),
        "current_unmatched": int(len(current)),
        "unmatched_reduction": int(len(previous) - len(current)),
        "unmatched_reduction_rate": float((len(previous) - len(current)) / len(previous)),
        "shared_unmatched_keys": int(len(shared_keys)),
        "previous_only_failure_keys": int(len(previous_key_set - current_key_set)),
        "current_only_failure_keys": int(len(current_key_set - previous_key_set)),
        "transitions": [
            {"previous_reason": old, "current_reason": new, "rows": count}
            for (old, new), count in transitions.most_common()
        ],
        "candidate_count_delta_on_persisted": [
            {"delta": delta, "rows": count}
            for delta, count in sorted(candidate_deltas.items())
        ],
    }


def name_features(frame: pd.DataFrame) -> dict:
    group = frame.loc[frame["reason"].eq("node_not_found")].copy()
    names = group["node_name"].astype(str)
    flags = {
        "contains_ascii_letters": names.str.contains(r"[A-Za-z]", regex=True),
        "contains_parentheses": names.str.contains(r"[()（）]", regex=True),
        "contains_slash_or_plus": names.str.contains(r"[/＋+]", regex=True),
        "contains_list_separator": names.str.contains(r"[、,，;；]", regex=True),
        "contains_connector": names.str.contains(r"(?:及|与|和)", regex=True),
        "length_ge_12": names.str.len().ge(12),
        "leading_or_trailing_space": names.ne(names.str.strip()),
        "contains_internal_space": names.str.contains(r"\s", regex=True),
    }
    feature_rows = []
    for label, mask in flags.items():
        feature_rows.append({
            "feature": label,
            "rows": int(mask.sum()),
            "share": float(mask.mean()) if len(mask) else 0.0,
        })

    group["normalized_node_name"] = group["node_name"].map(normalize_text)
    normalized_collision_rows = int(group.duplicated(subset=["chain_name", "normalized_node_name"], keep=False).sum())
    return {
        "rows": int(len(group)),
        "features": feature_rows,
        "normalized_collision_rows": normalized_collision_rows,
        "normalized_unique_nodes": int(group["normalized_node_name"].nunique()),
    }


def chain_reason_matrix(frame: pd.DataFrame) -> list[dict]:
    matrix = pd.crosstab(frame["chain_name"], frame["reason"])
    for column in ["node_not_found", "node_ambiguous", "industry_not_found"]:
        if column not in matrix.columns:
            matrix[column] = 0
    matrix["total_unmatched"] = matrix.sum(axis=1)
    matrix = matrix.sort_values("total_unmatched", ascending=False)
    return [
        {
            "chain_name": str(index),
            "node_not_found": int(row["node_not_found"]),
            "node_ambiguous": int(row["node_ambiguous"]),
            "industry_not_found": int(row["industry_not_found"]),
            "total_unmatched": int(row["total_unmatched"]),
        }
        for index, row in matrix.iterrows()
    ]


def industry_not_found_detail(frame: pd.DataFrame) -> list[dict]:
    group = frame.loc[frame["reason"].eq("industry_not_found")].copy()
    group["code_is_four_digits"] = group["industry_code"].str.fullmatch(r"\d{4}")
    summary = (
        group.groupby(["industry_code", "industry_name", "code_is_four_digits"], dropna=False)
        .agg(rows=("csv_row", "size"), chains=("chain_name", "nunique"))
        .reset_index()
        .sort_values(["rows", "industry_code"], ascending=[False, True])
    )
    return summary.to_dict(orient="records")


def representative_samples(frame: pd.DataFrame, per_reason: int = 10) -> list[dict]:
    samples = []
    for reason, group in frame.groupby("reason", sort=False):
        ordered = group.sort_values(["chain_name", "node_name", "industry_code", "line"])
        for _, row in ordered.head(per_reason).iterrows():
            samples.append({
                "csv_row": int(row["csv_row"]),
                "line": str(row["line"]),
                "chain_name": str(row["chain_name"]),
                "node_name": str(row["node_name"]),
                "industry_code": str(row["industry_code"]),
                "industry_name": str(row["industry_name"]),
                "node_candidates": int(row["node_candidates_num"]) if pd.notna(row["node_candidates_num"]) else None,
                "reason": str(reason),
            })
    return samples


def source_workbook_profile(path: Path) -> dict:
    try:
        book = pd.ExcelFile(path)
        sheets = []
        for sheet_name in book.sheet_names:
            frame = pd.read_excel(path, sheet_name=sheet_name, dtype=str)
            sheets.append({"sheet_name": sheet_name, "rows": int(len(frame)), "columns": int(len(frame.columns))})
        return {"available": True, "sheets": sheets}
    except Exception as exc:
        return {"available": False, "error": f"{type(exc).__name__}: {exc}"}


def main() -> None:
    current = load_csv(CURRENT_PATH)
    previous = load_csv(PREVIOUS_PATH)
    output = {
        "sources": {
            "current": str(CURRENT_PATH),
            "previous": str(PREVIOUS_PATH),
            "source_workbook": str(SOURCE_XLSX_PATH),
        },
        "current_profile": profile(current),
        "previous_profile": profile(previous),
        "reason_summary": reason_summary(current),
        "invariant_checks": invariant_checks(current),
        "comparison": compare_runs(current, previous),
        "node_not_found_name_features": name_features(current),
        "chain_reason_matrix": chain_reason_matrix(current),
        "industry_not_found_detail": industry_not_found_detail(current),
        "representative_samples": representative_samples(current),
        "source_workbook_profile": source_workbook_profile(SOURCE_XLSX_PATH),
    }
    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
