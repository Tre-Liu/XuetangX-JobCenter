import csv
import glob
import json
import os
import random
import re
from collections import Counter, defaultdict


DATA_DIR = "/Users/liuhongzhe/Desktop/应届生招聘大数据（2014-2025.6）/分年份保存数据"
OUT_DIR = "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/work/platform-source-mapping"
SAMPLE_SIZE = 12
TOP_N = 12
random.seed(20260722)


def clean(value):
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()


files = sorted(
    glob.glob(os.path.join(DATA_DIR, "应届生招聘大数据*.csv")),
    key=lambda p: int(re.search(r"(20\d{2})", os.path.basename(p)).group(1)),
)

stats = defaultdict(
    lambda: {
        "total": 0,
        "by_year": Counter(),
        "experience": Counter(),
        "education": Counter(),
        "category": Counter(),
        "city": Counter(),
        "region": Counter(),
        "samples": [],
    }
)
year_totals = Counter()

for path in files:
    year = int(re.search(r"(20\d{2})", os.path.basename(path)).group(1))
    print(f"START {year} {os.path.getsize(path)}", flush=True)
    with open(path, "r", encoding="utf-8-sig", newline="", errors="replace") as handle:
        reader = csv.DictReader(handle)
        for row_num, row in enumerate(reader, start=2):
            source = clean(row.get("来源")) or "（空白）"
            item = stats[source]
            item["total"] += 1
            item["by_year"][str(year)] += 1
            year_totals[str(year)] += 1
            for key, column in (
                ("experience", "要求经验"),
                ("education", "学历要求"),
                ("category", "招聘类别"),
                ("city", "工作城市"),
                ("region", "工作区域"),
            ):
                value = clean(row.get(column))
                if value:
                    item[key][value] += 1

            sample = {
                "year": year,
                "row": row_num,
                "company": clean(row.get("企业名称")),
                "job": clean(row.get("招聘岗位")),
                "city": clean(row.get("工作城市")),
                "region": clean(row.get("工作区域")),
                "salary_min": clean(row.get("最低月薪")),
                "salary_max": clean(row.get("最高月薪")),
                "education": clean(row.get("学历要求")),
                "experience": clean(row.get("要求经验")),
                "category": clean(row.get("招聘类别")),
                "sub_category": clean(row.get("初级分类")),
                "company_location": clean(row.get("公司地点")),
                "work_location": clean(row.get("工作地点")),
                "publish_date": clean(row.get("招聘发布日期")),
                "description": clean(row.get("职位描述"))[:600],
            }
            if len(item["samples"]) < SAMPLE_SIZE:
                item["samples"].append(sample)
            else:
                pick = random.randrange(item["total"])
                if pick < SAMPLE_SIZE:
                    item["samples"][pick] = sample
    print(f"DONE {year} {year_totals[str(year)]}", flush=True)

result = {
    "data_dir": DATA_DIR,
    "year_totals": dict(year_totals),
    "sources": {},
}

for source, item in sorted(
    stats.items(), key=lambda kv: (kv[0] == "（空白）", -kv[1]["total"], kv[0])
):
    result["sources"][source] = {
        "total": item["total"],
        "by_year": dict(sorted(item["by_year"].items())),
        "experience_top": item["experience"].most_common(TOP_N),
        "education_top": item["education"].most_common(TOP_N),
        "category_top": item["category"].most_common(TOP_N),
        "city_top": item["city"].most_common(TOP_N),
        "region_top": item["region"].most_common(TOP_N),
        "samples": item["samples"],
    }

os.makedirs(OUT_DIR, exist_ok=True)
out_path = os.path.join(OUT_DIR, "source_profile.json")
with open(out_path, "w", encoding="utf-8") as handle:
    json.dump(result, handle, ensure_ascii=False, indent=2)

print(f"WROTE {out_path}", flush=True)
print(f"SOURCES {len(result['sources'])}", flush=True)
