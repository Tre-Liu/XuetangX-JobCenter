import csv
import glob
import json
import os
import random
import re
from collections import Counter, defaultdict


DATA_DIR = "/Users/liuhongzhe/Desktop/应届生招聘大数据（2014-2025.6）/分年份保存数据"
OUT_PATH = "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/work/platform-source-mapping/deep_unknown_samples.json"
KNOWN_OR_REVIEWED = {
    "平台2", "平台4", "平台9", "平台10", "平台15", "平台16", "平台43", "平台75",
}
GLOBAL_SAMPLE_SIZE = 40
YEAR_SAMPLE_SIZE = 5
random.seed(20260723)

PLATFORM_MARKERS = {
    "智联招聘": re.compile(r"智联招聘|zhaopin\.com", re.I),
    "前程无忧": re.compile(r"前程无忧|51job", re.I),
    "BOSS直聘": re.compile(r"boss直聘|zhipin\.com", re.I),
    "猎聘": re.compile(r"猎聘|liepin\.com", re.I),
    "拉勾": re.compile(r"拉勾|lagou\.com", re.I),
    "看准网": re.compile(r"看准网|kanzhun\.com", re.I),
    "58同城": re.compile(r"58同城|58\.com", re.I),
    "赶集网": re.compile(r"赶集网|ganji\.com", re.I),
    "大街网": re.compile(r"大街网|dajie\.com", re.I),
    "智通人才网": re.compile(r"智通人才|智通直聘|job5156\.com", re.I),
    "应届生求职网": re.compile(r"应届生求职网|yingjiesheng\.com", re.I),
    "实习僧": re.compile(r"实习僧|shixiseng\.com", re.I),
    "百姓网": re.compile(r"百姓网|baixing\.com", re.I),
    "中华英才网": re.compile(r"中华英才网|chinahr\.com", re.I),
    "卓博人才网": re.compile(r"卓博人才|jobcn\.com", re.I),
    "一览英才网": re.compile(r"一览英才|job1001\.com", re.I),
    "中国人才热线": re.compile(r"中国人才热线|cjol\.com", re.I),
    "地方人才网": re.compile(r"人才网|招聘网", re.I),
}
URL_RE = re.compile(r"(?:https?://)?(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)+)", re.I)


def clean(value):
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()


def sample_row(row, year, row_num):
    return {
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
        "description": clean(row.get("职位描述"))[:900],
    }


stats = defaultdict(
    lambda: {
        "total": 0,
        "by_year": Counter(),
        "global_samples": [],
        "year_samples": defaultdict(list),
        "marker_hits": Counter(),
        "domains": Counter(),
        "salary_pairs": Counter(),
        "experience": Counter(),
        "education": Counter(),
        "category": Counter(),
        "job_suffix": Counter(),
    }
)

files = sorted(
    glob.glob(os.path.join(DATA_DIR, "应届生招聘大数据*.csv")),
    key=lambda p: int(re.search(r"(20\d{2})", os.path.basename(p)).group(1)),
)

for file_path in files:
    year = int(re.search(r"(20\d{2})", os.path.basename(file_path)).group(1))
    print(f"START {year}", flush=True)
    with open(file_path, "r", encoding="utf-8-sig", newline="", errors="replace") as handle:
        reader = csv.DictReader(handle)
        for row_num, row in enumerate(reader, start=2):
            source = clean(row.get("来源")) or "（空白）"
            if source in KNOWN_OR_REVIEWED or source == "（空白）":
                continue
            item = stats[source]
            item["total"] += 1
            item["by_year"][str(year)] += 1

            experience = clean(row.get("要求经验"))
            education = clean(row.get("学历要求"))
            category = clean(row.get("招聘类别"))
            salary_pair = f"{clean(row.get('最低月薪'))}|{clean(row.get('最高月薪'))}"
            job = clean(row.get("招聘岗位"))
            description = clean(row.get("职位描述"))
            combined = " ".join((job, description, clean(row.get("公司地点")), clean(row.get("工作地点"))))

            if experience:
                item["experience"][experience] += 1
            if education:
                item["education"][education] += 1
            if category:
                item["category"][category] += 1
            if salary_pair != "|":
                item["salary_pairs"][salary_pair] += 1

            suffix_match = re.search(r"(\([^()]{2,40}\)|（[^（）]{2,40}）)$", job)
            if suffix_match:
                item["job_suffix"][suffix_match.group(1)] += 1

            for marker, pattern in PLATFORM_MARKERS.items():
                if pattern.search(combined):
                    item["marker_hits"][marker] += 1
            for domain in URL_RE.findall(combined):
                domain = domain.lower().rstrip(".,;:/")
                if "macrodatas" not in domain and len(domain) <= 80:
                    item["domains"][domain] += 1

            sample = sample_row(row, year, row_num)
            if len(item["global_samples"]) < GLOBAL_SAMPLE_SIZE:
                item["global_samples"].append(sample)
            else:
                pick = random.randrange(item["total"])
                if pick < GLOBAL_SAMPLE_SIZE:
                    item["global_samples"][pick] = sample

            year_seen = item["by_year"][str(year)]
            year_bucket = item["year_samples"][str(year)]
            if len(year_bucket) < YEAR_SAMPLE_SIZE:
                year_bucket.append(sample)
            else:
                pick = random.randrange(year_seen)
                if pick < YEAR_SAMPLE_SIZE:
                    year_bucket[pick] = sample
    print(f"DONE {year}", flush=True)

result = {"sources": {}}
for source, item in sorted(stats.items(), key=lambda pair: -pair[1]["total"]):
    result["sources"][source] = {
        "total": item["total"],
        "by_year": dict(sorted(item["by_year"].items())),
        "experience_top": item["experience"].most_common(15),
        "education_top": item["education"].most_common(15),
        "category_top": item["category"].most_common(15),
        "salary_pairs_top": item["salary_pairs"].most_common(15),
        "job_suffix_top": item["job_suffix"].most_common(15),
        "marker_hits": item["marker_hits"].most_common(),
        "domains_top": item["domains"].most_common(20),
        "global_samples": item["global_samples"],
        "year_samples": dict(sorted(item["year_samples"].items())),
    }

os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
with open(OUT_PATH, "w", encoding="utf-8") as handle:
    json.dump(result, handle, ensure_ascii=False, indent=2)

print(f"WROTE {OUT_PATH}", flush=True)
print(f"SOURCES {len(result['sources'])}", flush=True)
