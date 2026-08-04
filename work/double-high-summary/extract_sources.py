import json
import csv
from collections import defaultdict
from docx import Document
import pandas as pd

CITY = {
    "浙江药科职业大学": "宁波", "金华职业技术大学": "金华", "浙江机电职业技术大学": "杭州",
    "浙江广厦建设职业技术大学": "金华", "宁波幼儿师范高等专科学校": "宁波", "浙江交通职业技术学院": "杭州",
    "宁波职业技术学院": "宁波", "温州职业技术学院": "温州", "浙江旅游职业学院": "杭州",
    "杭州职业技术学院": "杭州", "浙江工商职业技术学院": "宁波", "浙江商业职业技术学院": "杭州",
    "浙江艺术职业学院": "杭州", "浙江金融职业学院": "杭州", "浙江经贸职业技术学院": "杭州",
    "浙江建设职业技术学院": "杭州", "浙江纺织服装职业技术学院": "宁波", "湖州职业技术学院": "湖州",
    "绍兴职业技术学院": "绍兴", "浙江工业职业技术学院": "绍兴", "义乌工商职业技术学院": "金华",
    "台州职业技术学院": "台州", "衢州职业技术学院": "衢州", "浙江工贸职业技术学院": "温州",
    "浙江育英职业技术学院": "杭州", "浙江东方职业技术学院": "温州", "浙江警官职业学院": "杭州",
    "浙江经济职业技术学院": "杭州", "宁波卫生职业技术学院": "宁波", "宁波城市职业技术学院": "宁波",
    "丽水职业技术学院": "丽水", "嘉兴职业技术学院": "嘉兴", "嘉兴南洋职业技术学院": "嘉兴",
    "浙江长征职业技术学院": "杭州", "杭州万向职业技术学院": "杭州", "杭州科技职业技术学院": "杭州",
    "浙江国际海运职业技术学院": "舟山", "台州科技职业学院": "台州", "浙江邮电职业技术学院": "绍兴",
    "浙江体育职业技术学院": "杭州", "浙江同济科技职业学院": "杭州", "浙江汽车职业技术学院": "台州",
    "浙江横店影视职业学院": "金华", "温州科技职业学院": "温州", "浙江特殊教育职业学院": "杭州",
    "浙江农业商贸职业学院": "绍兴", "浙江舟山群岛新区旅游与健康职业学院": "舟山", "浙江安防职业技术学院": "温州",
}

doc = Document("sources/zhejiang-2025.docx")
groups = defaultdict(list)
for row in doc.tables[0].rows[1:]:
    cells = [cell.text.strip() for cell in row.cells]
    groups[cells[2]].append(cells[1])

rows = [{"school": school, "city": CITY[school], "groups": "；".join(items)} for school, items in groups.items()]
with open("sources/zhejiang.json", "w", encoding="utf-8") as f:
    json.dump(rows, f, ensure_ascii=False, indent=2)

ANHUI_CITY = {
    "芜湖职业技术学院":"芜湖","安徽职业技术学院":"合肥","安徽商贸职业技术学院":"芜湖","合肥职业技术学院":"合肥","安徽机电职业技术学院":"芜湖","安徽工商职业学院":"合肥","合肥幼儿师范高等专科学校":"合肥","安徽财贸职业学院":"合肥","安庆职业技术学院":"安庆","安徽国际商务职业学院":"合肥","亳州职业技术学院":"亳州","安徽医学高等专科学校":"合肥","安徽警官职业学院":"合肥","安徽中医药高等专科学校":"芜湖","马鞍山师范高等专科学校":"马鞍山","安徽工业经济职业技术学院":"合肥","安徽水利水电职业技术学院":"合肥","阜阳职业技术学院":"阜阳","安徽交通职业技术学院":"合肥","池州职业技术学院":"池州","安徽国防科技职业学院":"六安","六安职业技术学院":"六安","安徽电子信息职业技术学院":"蚌埠","宣城职业技术学院":"宣城","铜陵职业技术学院":"铜陵","淮南职业技术学院":"淮南","安徽城市管理职业学院":"合肥","淮北职业技术学院":"淮北","安庆医药高等专科学校":"安庆","安徽审计职业学院":"合肥","滁州职业技术学院":"滁州","安徽邮电职业技术学院":"合肥","安徽电气工程职业技术学院":"合肥","皖西卫生职业学院":"六安","淮南联合大学":"淮南","徽商职业学院":"合肥","安徽粮食工程职业学院":"合肥","安徽中澳科技职业学院":"合肥","滁州城市职业学院":"滁州","安徽扬子职业技术学院":"芜湖","宿州职业技术学院":"宿州","安徽体育运动职业技术学院":"合肥","安徽卫生健康职业学院":"池州","安徽艺术职业学院":"合肥","桐城师范高等专科学校":"安庆","马鞍山职业技术学院":"马鞍山","安徽黄梅戏艺术职业学院":"安庆","安徽新闻出版职业技术学院":"合肥","黄山职业技术学院":"黄山","安徽绿海商务职业学院":"合肥","安徽广播影视职业技术学院":"合肥","合肥财经职业学院":"合肥","安徽工业职业技术学院":"铜陵","合肥信息技术职业学院":"合肥","合肥科技职业学院":"合肥","安徽汽车职业技术学院":"阜阳","合肥通用职业技术学院":"合肥","皖北卫生职业学院":"宿州","安徽矿业职业技术学院":"淮北","阜阳幼儿师范高等专科学校":"阜阳","安徽冶金科技职业学院":"马鞍山"
}
ah_rows, last_school, last_category = [], "", ""
with open("sources/anhui/anhui-2023.csv", encoding="utf-8-sig") as f:
    for i, row in enumerate(csv.reader(f)):
        if i < 3 or not row:
            continue
        category, school, group = (row + ["", "", ""])[1:4]
        if category.strip():
            last_category = category.replace("\n", "")
        if school.strip():
            last_school = school.strip()
        if group.strip():
            ah_rows.append({"school": last_school, "city": ANHUI_CITY[last_school], "type": last_category, "group": group.strip()})
aggregated = {}
for item in ah_rows:
    key = (item["school"], item["city"], item["type"])
    aggregated.setdefault(key, []).append(item["group"])
with open("sources/anhui.json", "w", encoding="utf-8") as f:
    json.dump([{"school": k[0], "city": k[1], "type": k[2], "groups": "；".join(v)} for k, v in aggregated.items()], f, ensure_ascii=False, indent=2)

JIANGXI_CITY = {
    "九江职业技术学院":"九江","江西应用技术职业学院":"赣州","江西环境工程职业学院":"赣州","江西财经职业学院":"九江",
    "江西交通职业技术学院":"南昌","江西外语外贸职业学院":"南昌","江西现代职业技术学院":"南昌","江西工业贸易职业技术学院":"南昌",
    "江西机电职业技术学院":"南昌","江西旅游商贸职业学院":"南昌","江西制造职业技术学院":"南昌","吉安职业技术学院":"吉安",
    "宜春职业技术学院":"宜春","江西建设职业技术学院":"南昌","江西陶瓷工艺美术职业技术学院":"景德镇","江西电力职业技术学院":"南昌",
    "江西泰豪动漫职业学院":"南昌","江西信息应用职业技术学院":"南昌","江西软件职业技术大学":"南昌","江西水利职业学院":"南昌",
    "江西工程职业学院":"南昌","上饶职业技术学院":"上饶","江西师范高等专科学校":"鹰潭","江西工业工程职业技术学院":"萍乡",
    "江西工业职业技术学院":"南昌","江西冶金职业技术学院":"新余","九江职业大学":"九江","江西新能源科技职业学院":"新余",
    "江西医学高等专科学校":"上饶","赣南卫生健康职业学院":"赣州","江西中医药高等专科学校":"抚州","抚州职业技术学院":"抚州",
    "江西航空职业技术学院":"南昌","江西艺术职业学院":"南昌","南昌职业大学":"南昌","共青科技职业学院":"九江",
    "江西应用工程职业学院":"萍乡","江西农业工程职业学院":"宜春","江西卫生职业学院":"南昌","江西生物科技职业学院":"南昌",
    "江西青年职业学院":"南昌","上饶幼儿师范高等专科学校":"上饶","赣州职业技术学院":"赣州","和君职业学院":"赣州",
    "江西司法警官职业学院":"南昌",
}
jx_tables = pd.read_html("sources/jiangxi-page.html", encoding="utf-8")
jx_school_rows = jx_tables[0].iloc[1:].copy()
jx_school_rows.columns = ["序号", "学校", "档次"]
jx_group_rows = jx_tables[1].iloc[1:].copy()
jx_group_rows.columns = ["序号", "服务面向", "学校", "专业群"]
jx_aggregate = {}
for _, row in jx_school_rows.iterrows():
    school = str(row["学校"]).strip()
    jx_aggregate[school] = {"school": school, "city": JIANGXI_CITY[school], "type": f"高水平高职学校（{row['档次']}）", "groups": []}
for _, row in jx_group_rows.iterrows():
    school, group = str(row["学校"]).strip(), str(row["专业群"]).strip()
    if school not in jx_aggregate:
        jx_aggregate[school] = {"school": school, "city": JIANGXI_CITY[school], "type": "高水平专业群建设单位", "groups": []}
    jx_aggregate[school]["groups"].append(group)
with open("sources/jiangxi.json", "w", encoding="utf-8") as f:
    json.dump(
        [{**item, "groups": "；".join(item["groups"])} for item in jx_aggregate.values()],
        f,
        ensure_ascii=False,
        indent=2,
    )
