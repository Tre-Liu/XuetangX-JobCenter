#!/usr/bin/env python3
import csv
import json
import math
import re
import sys
from array import array
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

import numpy as np


SOURCE = Path("/Users/liuhongzhe/Desktop/应届生招聘大数据（2014-2025.6）/分年份保存数据/应届生招聘大数据2025.csv")
OUTDIR = Path(__file__).resolve().parent
MISSING = {"", "-", "--", "无", "暂无", "未知", "null", "none", "nan", "n/a"}


def clean(value):
    return (value or "").strip()


def is_missing(value):
    return clean(value).lower() in MISSING


def parse_num(value):
    v = clean(value).replace(",", "")
    if is_missing(v):
        return None
    try:
        x = float(v)
        return x if math.isfinite(x) else None
    except ValueError:
        return None


def title_text(title):
    return re.sub(r"\s+", "", clean(title).lower())


def has_any(text, words):
    return any(w in text for w in words)


def classify_family(title):
    t = title_text(title)
    # Explicit selling roles take precedence over the industry being sold.
    if has_any(t, ["销售", "业务员", "业务经理", "客户经理", "招商主管", "招商专员", "渠道经理", "渠道专员", "置业顾问", "房产经纪", "房地产经纪", "地产中介", "经纪人", "保险顾问", "课程顾问", "招生顾问", "电话营销", "电销", "商务拓展", "商务专员", "bd经理", "bd专员", "市场推广", "市场营销", "市场专员", "投标专员", "招投标", "医药代表"]):
        if has_any(t, ["售前技术", "技术售前", "销售工程师", "技术支持工程师"]):
            return "IT/数字技术"
        return "销售/商务/市场"
    if has_any(t, ["医生", "医师", "护士", "护理", "药师", "临床", "检验技师", "康复治疗", "口腔", "影像技师", "医学", "兽医"]):
        return "医疗健康"
    if has_any(t, ["教师", "老师", "讲师", "教务", "教研", "辅导员", "班主任", "培训师", "课程研发", "教育咨询", "教练", "助教"]):
        return "教育培训"
    if has_any(t, ["java", "python", "golang", "c++", "前端", "后端", "全栈", "软件", "程序员", "算法", "人工智能", "ai工程", "大模型", "机器学习", "深度学习", "数据开发", "数据分析", "数据科学", "大数据", "数据库", "网络工程", "信息安全", "网络安全", "运维", "实施工程师", "测试工程师", "测试开发", "嵌入式", "硬件工程", "芯片", "fpga", "web开发", "ios", "android", "安卓", "it技术", "技术支持", "系统工程师"]):
        return "IT/数字技术"
    if has_any(t, ["土木", "建筑", "施工", "造价", "监理", "测绘", "测量员", "bim", "结构工程", "岩土", "路桥", "市政工程", "暖通", "给排水", "装饰工程", "装修工程", "园林工程", "工程管理"]):
        return "建筑/地产工程"
    if has_any(t, ["生产", "制造", "工艺", "机械", "机电", "电气", "自动化", "设备", "质量", "质检", "品质", "技术员", "技术工程师", "售后工程师", "电子工程师", "项目工程师", "操作工", "普工", "焊工", "钳工", "车工", "电工", "cnc", "数控", "模具", "维修工", "机修", "装配", "工业工程", "材料工程", "化工工程", "研发工程师", "实验员"]):
        return "生产制造/工程技术"
    if has_any(t, ["会计", "财务", "出纳", "审计", "税务", "投行", "证券", "基金", "理财", "银行", "风控", "融资", "投资经理", "精算"]):
        return "财会金融"
    if has_any(t, ["ui设计", "ux", "平面设计", "视觉设计", "工业设计", "产品设计", "室内设计", "服装设计", "设计师", "广告设计", "美工", "文案", "编辑", "记者", "翻译", "摄影", "摄像", "视频", "剪辑", "新媒体", "自媒体", "媒介", "主播", "直播", "广告创意", "内容运营"]):
        return "设计/传媒/内容"
    if has_any(t, ["采购", "供应链", "外贸", "国际贸易", "跟单", "报关", "单证员", "进出口"]):
        return "供应链/采购/外贸"
    if has_any(t, ["物流", "仓储", "仓管", "仓库", "配送", "快递", "司机", "调度员", "运输", "货运", "高铁", "铁路", "海运操作"]):
        return "物流/仓储/运输"
    if has_any(t, ["客服", "前台", "服务员", "收银", "店员", "营业员", "导购", "厨师", "餐饮", "酒店", "民宿", "管家", "茶艺", "保安", "保洁", "美容师", "美甲", "验光师", "旅游顾问", "票务", "物业管理员"]):
        return "客服/零售/生活服务"
    if has_any(t, ["产品经理", "产品专员", "产品助理", "用户运营", "活动运营", "电商运营", "亚马逊运营", "平台运营", "社区运营", "商家运营", "运营专员", "运营经理", "运营助理", "项目运营"]):
        return "产品/运营"
    if has_any(t, ["人力资源", "hr", "招聘专员", "行政", "文员", "秘书", "人事", "总经理助理", "办公室", "档案", "资料员", "资料管理", "图书管理员", "统计员", "订单处理", "后勤", "内勤", "助理"]):
        return "行政/人力/职能"
    if has_any(t, ["律师", "法务", "合规", "咨询顾问", "管理咨询", "战略咨询", "研究员", "研究助理", "行业分析", "政策研究", "专利代理"]):
        return "咨询/研究/法务"
    if has_any(t, ["农艺", "农业", "林业", "畜牧", "养殖", "水产", "环保", "环境工程", "新能源", "光伏", "风电", "能源工程"]):
        return "农林牧渔/环境能源"
    if has_any(t, ["管培生", "管理培训生", "储备干部", "储备店长", "实习生", "培训生"]):
        return "管培/储备/通用"
    return "其他/难判定"


def standard_role(title, family):
    t = title_text(title)
    rules = [
        ("销售代表/业务员", ["销售代表", "销售专员", "业务员", "销售顾问"]),
        ("客户经理", ["客户经理", "大客户经理", "客户代表"]),
        ("销售经理/主管", ["销售经理", "销售主管", "营销经理"]),
        ("房产经纪/置业顾问", ["置业顾问", "房产经纪", "房地产经纪", "经纪人"]),
        ("渠道/商务拓展", ["渠道", "商务拓展", "bd经理", "bd专员", "招商"]),
        ("市场推广/营销", ["市场推广", "市场营销", "营销专员", "推广专员"]),
        ("客服", ["客服", "客户服务"]),
        ("运营", ["运营专员", "运营经理", "运营助理", "用户运营", "活动运营", "平台运营"]),
        ("电商/新媒体运营", ["电商运营", "新媒体运营", "直播运营", "短视频运营"]),
        ("产品经理/产品岗", ["产品经理", "产品专员", "产品助理"]),
        ("软件开发", ["java", "python", "golang", "c++", "前端", "后端", "全栈", "软件开发", "程序员", "ios", "android", "安卓"]),
        ("算法/AI/数据", ["算法", "人工智能", "ai工程", "大模型", "机器学习", "深度学习", "数据科学", "数据分析", "大数据", "数据开发"]),
        ("测试/运维/实施", ["测试工程师", "测试开发", "运维", "实施工程师", "技术支持"]),
        ("硬件/嵌入式/电子", ["嵌入式", "硬件工程", "芯片", "fpga", "电子工程"]),
        ("生产/储备生产管理", ["生产", "生产管理", "生产主管", "生产领班"]),
        ("机械/电气/自动化工程", ["机械", "机电", "电气", "自动化", "设备工程"]),
        ("工艺/质量/研发工程", ["工艺", "质量", "质检", "品质", "研发工程师", "实验员"]),
        ("普工/操作/装配", ["操作工", "普工", "装配", "焊工", "钳工", "车工", "cnc", "数控"]),
        ("建筑施工/工程管理", ["施工", "工程管理", "项目工程", "建筑工程"]),
        ("造价/监理/测绘", ["造价", "监理", "测绘", "测量员", "bim"]),
        ("会计/财务/出纳", ["会计", "财务", "出纳"]),
        ("审计/税务/风控", ["审计", "税务", "风控", "合规"]),
        ("教师/讲师", ["教师", "老师", "讲师"]),
        ("教务/教研/培训", ["教务", "教研", "辅导员", "培训师"]),
        ("医生/临床", ["医生", "医师", "临床"]),
        ("护士/护理", ["护士", "护理"]),
        ("药学/检验/康复", ["药师", "检验技师", "康复治疗", "药学"]),
        ("设计师", ["设计师", "平面设计", "视觉设计", "ui设计", "工业设计"]),
        ("内容/文案/编辑", ["文案", "编辑", "记者", "内容运营"]),
        ("视频/直播/摄影", ["摄影", "摄像", "视频", "剪辑", "主播", "直播"]),
        ("行政/文员/助理", ["行政", "文员", "秘书", "办公室", "内勤", "助理"]),
        ("人力资源/招聘", ["人力资源", "人事", "招聘专员", "hr"]),
        ("采购/供应链", ["采购", "供应链"]),
        ("外贸/跟单/报关", ["外贸", "国际贸易", "跟单", "报关", "单证员"]),
        ("物流/仓储", ["物流", "仓储", "仓管", "仓库"]),
        ("司机/配送/快递", ["司机", "配送", "快递", "货运"]),
        ("门店/零售服务", ["店员", "营业员", "导购", "收银"]),
        ("餐饮/酒店服务", ["服务员", "厨师", "餐饮", "酒店", "前台"]),
        ("咨询/研究/法务", ["咨询顾问", "管理咨询", "研究员", "行业分析", "律师", "法务"]),
        ("管培生/储备干部", ["管培生", "管理培训生", "储备干部", "储备店长"]),
        ("实习生", ["实习生", "实习"]),
    ]
    for label, words in rules:
        if has_any(t, words):
            return label
    return family


def salary_band(mid):
    if mid < 4000:
        return "4千以下"
    if mid < 6000:
        return "4千-6千"
    if mid < 8000:
        return "6千-8千"
    if mid < 10000:
        return "8千-1万"
    if mid < 15000:
        return "1万-1.5万"
    if mid < 20000:
        return "1.5万-2万"
    if mid < 30000:
        return "2万-3万"
    return "3万以上"


def main():
    OUTDIR.mkdir(parents=True, exist_ok=True)
    counters = defaultdict(Counter)
    missing = Counter()
    numeric_invalid = Counter()
    family_salary = defaultdict(lambda: {"count": 0, "sum": 0.0, "values": array("d"), "bands": Counter()})
    education_salary = defaultdict(lambda: array("d"))
    experience_salary = defaultdict(lambda: array("d"))
    city_salary = defaultdict(lambda: array("d"))
    city_family = defaultdict(Counter)
    edu_family = defaultdict(Counter)
    exp_family = defaultdict(Counter)
    family_titles = defaultdict(Counter)
    key_hashes = array("Q")
    listing_hashes = array("Q")
    seen_listing_hashes = set()
    dedup_family = Counter()
    dedup_city = Counter()
    row_hashes = array("Q")
    salary_values = array("d")
    total = 0
    malformed = 0

    with SOURCE.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.reader(f)
        header = next(reader)
        idx = {name: i for i, name in enumerate(header)}
        for row in reader:
            if len(row) != len(header):
                malformed += 1
                continue
            total += 1
            if total % 250000 == 0:
                print(f"processed {total:,}", file=sys.stderr, flush=True)
            for i, name in enumerate(header):
                if is_missing(row[i]):
                    missing[name] += 1

            company = clean(row[idx["企业名称"]])
            title = clean(row[idx["招聘岗位"]])
            city = clean(row[idx["工作城市"]]) or "未标注"
            district = clean(row[idx["工作区域"]]) or "未标注"
            education = clean(row[idx["学历要求"]]) or "未标注"
            experience = clean(row[idx["要求经验"]]) or "未标注"
            industry = clean(row[idx["招聘类别"]]) or "未标注"
            source = clean(row[idx["来源"]]) or "未标注"
            publish_date = clean(row[idx["招聘发布日期"]])
            family = classify_family(title)
            role = standard_role(title, family)

            counters["company"][company or "未标注"] += 1
            counters["raw_title"][title or "未标注"] += 1
            counters["family"][family] += 1
            counters["role"][role] += 1
            family_titles[family][title or "未标注"] += 1
            counters["city"][city if not is_missing(city) else "未标注"] += 1
            counters["district"][district if not is_missing(district) else "未标注"] += 1
            counters["education"][education if not is_missing(education) else "未标注"] += 1
            counters["experience"][experience if not is_missing(experience) else "未标注"] += 1
            counters["industry"][industry if not is_missing(industry) else "未标注"] += 1
            counters["source"][source if not is_missing(source) else "未标注"] += 1
            city_family[city if not is_missing(city) else "未标注"][family] += 1
            edu_family[education if not is_missing(education) else "未标注"][family] += 1
            exp_family[experience if not is_missing(experience) else "未标注"][family] += 1

            if publish_date and publish_date != "-":
                m = re.match(r"(\d{4})-(\d{2})", publish_date)
                if m:
                    counters["month"][f"{m.group(1)}-{m.group(2)}"] += 1
                else:
                    numeric_invalid["招聘发布日期"] += 1

            lo = parse_num(row[idx["最低月薪"]])
            hi = parse_num(row[idx["最高月薪"]])
            if lo is not None and hi is not None and lo > 0 and hi >= lo:
                mid = (lo + hi) / 2
                salary_values.append(mid)
                counters["salary_band"][salary_band(mid)] += 1
                fs = family_salary[family]
                fs["count"] += 1
                fs["sum"] += mid
                fs["values"].append(mid)
                fs["bands"][salary_band(mid)] += 1
                education_salary[education if not is_missing(education) else "未标注"].append(mid)
                experience_salary[experience if not is_missing(experience) else "未标注"].append(mid)
                city_salary[city if not is_missing(city) else "未标注"].append(mid)
            elif lo == 0 and hi == 0:
                numeric_invalid["零薪资占位"] += 1
            elif not (lo is None and hi is None):
                numeric_invalid["薪资区间"] += 1

            employment_tags = []
            tt = title_text(title)
            if has_any(tt, ["管培生", "管理培训生", "储备干部", "储备店长", "储备人才"]):
                employment_tags.append("管培/储备")
            if has_any(tt, ["实习", "intern"]):
                employment_tags.append("实习")
            if has_any(tt, ["应届", "校招", "校园招聘"]):
                employment_tags.append("显式应届/校招")
            if not employment_tags:
                employment_tags.append("未显式标注")
            for tag in employment_tags:
                counters["employment_tag"][tag] += 1

            key_tuple = (
                company, title, city, district,
                clean(row[idx["最低月薪"]]), clean(row[idx["最高月薪"]]),
                publish_date, source,
            )
            key_hashes.append(hash(key_tuple) & ((1 << 64) - 1))
            listing_hash = hash(key_tuple[:-2]) & ((1 << 64) - 1)
            listing_hashes.append(listing_hash)
            if listing_hash not in seen_listing_hashes:
                seen_listing_hashes.add(listing_hash)
                dedup_family[family] += 1
                dedup_city[city if not is_missing(city) else "未标注"] += 1
            row_hashes.append(hash(tuple(row)) & ((1 << 64) - 1))

    def duplicates(values):
        a = np.frombuffer(values, dtype=np.uint64).copy()
        a.sort()
        if len(a) < 2:
            return {"duplicate_rows": 0, "duplicate_share": 0.0, "unique": int(len(a))}
        dup = int(np.count_nonzero(a[1:] == a[:-1]))
        return {"duplicate_rows": dup, "duplicate_share": dup / len(a), "unique": int(len(a) - dup)}

    salary_arr = np.frombuffer(salary_values, dtype=np.float64)
    salary_summary = {
        "valid_count": int(len(salary_arr)),
        "coverage": len(salary_arr) / total if total else 0,
        "mean": float(np.mean(salary_arr)) if len(salary_arr) else None,
        "quantiles": {str(q): float(np.quantile(salary_arr, q)) for q in [0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99]} if len(salary_arr) else {},
        "over_100k": int(np.count_nonzero(salary_arr > 100000)) if len(salary_arr) else 0,
    }

    family_salary_out = {}
    for family, item in family_salary.items():
        vals = np.frombuffer(item["values"], dtype=np.float64)
        family_salary_out[family] = {
            "count": item["count"],
            "coverage_vs_family": item["count"] / counters["family"][family],
            "mean": item["sum"] / item["count"] if item["count"] else None,
            "median": float(np.median(vals)) if len(vals) else None,
            "p75": float(np.quantile(vals, 0.75)) if len(vals) else None,
            "bands": dict(item["bands"]),
        }

    def group_salary_output(groups, allowed=None):
        out = {}
        for name, values in groups.items():
            if allowed is not None and name not in allowed:
                continue
            vals = np.frombuffer(values, dtype=np.float64)
            out[name] = {
                "count": int(len(vals)),
                "mean": float(np.mean(vals)) if len(vals) else None,
                "median": float(np.median(vals)) if len(vals) else None,
                "p25": float(np.quantile(vals, 0.25)) if len(vals) else None,
                "p75": float(np.quantile(vals, 0.75)) if len(vals) else None,
            }
        return out

    def top(counter, n=30):
        return [{"name": k, "count": int(v), "share": v / total} for k, v in counter.most_common(n)]

    results = {
        "source": str(SOURCE),
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "rows": total,
        "columns": len(header),
        "header": header,
        "malformed_rows": malformed,
        "missing": {k: {"count": int(missing[k]), "share": missing[k] / total} for k in header},
        "duplicates_exact_row_hash": duplicates(row_hashes),
        "duplicates_business_key_hash": duplicates(key_hashes),
        "duplicates_repost_key_hash": duplicates(listing_hashes),
        "dedup_repost_key": {
            "rows": len(seen_listing_hashes),
            "family": dict(dedup_family),
            "city": dict(dedup_city),
        },
        "salary": salary_summary,
        "family_salary": family_salary_out,
        "education_salary": group_salary_output(education_salary),
        "experience_salary": group_salary_output(experience_salary),
        "city_salary": group_salary_output(city_salary, {x["name"] for x in top(counters["city"], 30)}),
        "top": {name: top(counter, 50) for name, counter in counters.items()},
        "city_family": {city: dict(cnt) for city, cnt in sorted(city_family.items(), key=lambda kv: sum(kv[1].values()), reverse=True)[:30]},
        "education_family": {edu: dict(cnt) for edu, cnt in edu_family.items()},
        "experience_family": {exp: dict(cnt) for exp, cnt in exp_family.items()},
        "family_top_titles": {family: top(cnt, 50) for family, cnt in family_titles.items()},
        "numeric_invalid": dict(numeric_invalid),
    }
    (OUTDIR / "analysis_results.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({
        "rows": total,
        "malformed": malformed,
        "families": counters["family"].most_common(),
        "salary": salary_summary,
        "exact_duplicates": results["duplicates_exact_row_hash"],
        "business_key_duplicates": results["duplicates_business_key_hash"],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
