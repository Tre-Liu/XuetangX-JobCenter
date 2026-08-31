import unittest
from pathlib import Path

from pipeline import (
    atomize_competency,
    classify_competency,
    consume_task_table,
    detect_task_table_columns,
    parse_source_metadata,
    split_numbered_items,
    job_match_score,
    is_valid_source_job,
)


class PipelineTests(unittest.TestCase):
    def test_parse_source_metadata_from_collector_path(self):
        path = Path(
            "/root/documents/陕西/YLVTC_陕西农林职业技术大学/水利工程专业群/"
            "450201_水利工程/01-2025slgc.pdf"
        )

        self.assertEqual(
            parse_source_metadata(path),
            {
                "province": "陕西",
                "school": "陕西农林职业技术大学",
                "professional_group": "水利工程专业群",
                "major_code": "450201",
                "major": "水利工程",
                "source_file": "01-2025slgc.pdf",
            },
        )

    def test_split_numbered_items_preserves_wrapped_chinese_text(self):
        text = "1.施工图纸的识图能力\n2.管道及设备安装能力\n3.施工方案\n设计能力"

        self.assertEqual(
            split_numbered_items(text),
            ["施工图纸识读", "管道及设备安装", "施工方案设计"],
        )

    def test_detects_common_job_task_ability_table_headers(self):
        header = ["序号", "工作岗位", "典型工作任务", "职业能力", "支撑课程"]

        self.assertEqual(
            detect_task_table_columns(header),
            {"job": 1, "task": 2, "ability": 3, "course": 4},
        )

    def test_classifies_knowledge_skill_and_quality_atoms(self):
        cases = {
            "掌握水利工程识图规范": "知识",
            "编制施工组织方案": "技能",
            "具有质量意识": "素养",
            "与人合作": "素养",
        }

        self.assertEqual(
            {text: classify_competency(text) for text in cases},
            cases,
        )

    def test_consumes_page_spanning_task_table_with_forward_filled_job_and_task(self):
        page_one = [
            ["序号", "工作岗位", "典型工作任务", "职业能力", "支撑课程"],
            ["1", "施工岗位", "1.施工准备", "1.施工图纸的识图能力", "工程识图"],
            [None, None, None, "2.施工方案设计能力", None],
        ]
        page_two = [
            [None, None, "2.工程实施", "1.管道及设备安装能力", None],
        ]

        first_records, state = consume_task_table(page_one)
        second_records, _ = consume_task_table(page_two, state)

        self.assertEqual(
            first_records + second_records,
            [
                {
                    "source_job": "施工岗位",
                    "typical_task": "施工准备",
                    "competency": "施工图纸识读",
                    "supporting_course": "工程识图",
                },
                {
                    "source_job": "施工岗位",
                    "typical_task": "施工准备",
                    "competency": "施工方案设计",
                    "supporting_course": "工程识图",
                },
                {
                    "source_job": "施工岗位",
                    "typical_task": "工程实施",
                    "competency": "管道及设备安装",
                    "supporting_course": "工程识图",
                },
            ],
        )

    def test_repeated_header_resets_column_mapping_for_next_major(self):
        _, state = consume_task_table(
            [["序号", "工作岗位", "典型工作任务", "职业能力"], ["1", "岗位甲", "任务甲", "能力甲"]]
        )
        records, _ = consume_task_table(
            [["岗位群", "主要工作任务", "能力要求"], ["岗位乙", "任务乙", "能力乙"]],
            state,
        )

        self.assertEqual(records[0]["source_job"], "岗位乙")
        self.assertEqual(records[0]["typical_task"], "任务乙")

    def test_rejects_numeric_statistics_table_after_task_table(self):
        _, state = consume_task_table(
            [["工作岗位", "典型工作任务", "职业能力"], ["机器人工程师", "系统调试", "系统调试能力"]]
        )

        records, _ = consume_task_table(
            [["专业", "2022年", "2023年"], ["工业机器人技术", "9", "100%"]],
            state,
        )

        self.assertEqual(records, [])

    def test_atomizes_labeled_quality_knowledge_and_skill_sections(self):
        text = (
            "1.素质目标：具有质量意识；具有团队合作精神；"
            "2.知识目标：掌握三坐标测量原理；熟悉测头校验方法；"
            "3.能力目标：能够操作三坐标测量机；能够编写测量程序。"
        )

        self.assertEqual(
            atomize_competency(text),
            [
                {"category": "素养", "item": "质量意识"},
                {"category": "素养", "item": "团队合作精神"},
                {"category": "知识", "item": "掌握三坐标测量原理"},
                {"category": "知识", "item": "熟悉测头校验方法"},
                {"category": "技能", "item": "操作三坐标测量机"},
                {"category": "技能", "item": "编写测量程序"},
            ],
        )

    def test_job_match_score_uses_job_and_major_context(self):
        self.assertGreaterEqual(
            job_match_score(
                "工业机器人售后技术支持工程师",
                "售前售后技术支持工程师",
                "工业机器人技术",
            ),
            0.78,
        )
        self.assertGreaterEqual(
            job_match_score("数控机床操作工", "普通/数控机床操作岗位", "机械设计与制造"),
            0.78,
        )
        self.assertLess(
            job_match_score("销售区域经理", "汽车销售岗位", "汽车技术服务与营销"),
            0.78,
        )
        self.assertLess(
            job_match_score("通信质量管理", "质量管理岗", "给排水工程技术"),
            0.78,
        )
        self.assertLess(
            job_match_score("家装设计师", "包装设计师", "艺术设计"),
            0.78,
        )
        self.assertLess(
            job_match_score("见习工程师", "数据工程师", "大数据技术"),
            0.78,
        )
        self.assertLess(
            job_match_score("自动驾驶安全员", "安全员", "建设工程监理"),
            0.78,
        )
        self.assertLess(
            job_match_score("通信产品设计/产品工程师", "产品设计", "机械制造及自动化"),
            0.78,
        )
        self.assertLess(
            job_match_score("技术研发", "船舶动力技术研发助理", "船舶动力工程技术"),
            0.78,
        )
        self.assertLess(
            job_match_score("媒体", "新媒体运营", "数字媒体艺术设计"),
            0.78,
        )
        self.assertLess(
            job_match_score("自动化设备组装工", "自动化设备运维岗", "电气自动化技术"),
            0.78,
        )
        self.assertLess(
            job_match_score("自动化设备工程师", "自动化设备运维岗", "电气自动化技术"),
            0.78,
        )
        self.assertGreaterEqual(
            job_match_score("自动化设备维修保养", "自动化设备运维岗", "电气自动化技术"),
            0.78,
        )
        self.assertLess(
            job_match_score("视频剪辑培训招生顾问", "视频剪辑", "广告艺术设计"),
            0.78,
        )
        self.assertLess(
            job_match_score("防盗门喷漆工", "汽车喷漆工", "汽车制造与试验技术"),
            0.78,
        )
        self.assertLess(
            job_match_score("自动化设备学徒工", "自动化设备运维岗", "电气自动化技术"),
            0.78,
        )
        self.assertLess(
            job_match_score("新媒体运营助教", "新媒体运营", "数字媒体艺术设计"),
            0.78,
        )
        self.assertLess(
            job_match_score("新媒体运营招生专员", "新媒体运营", "数字媒体艺术设计"),
            0.78,
        )
        self.assertLess(
            job_match_score("CAD实习生", "电气CAD", "电气自动化技术"),
            0.78,
        )
        self.assertLess(
            job_match_score("生产管理", "安全生产管理岗位", "水利水电建筑工程"),
            0.78,
        )
        self.assertLess(
            job_match_score("规划与设计", "供应链网络规划与设计", "现代物流管理"),
            0.78,
        )
        self.assertGreaterEqual(
            job_match_score("新媒体运营实习", "新媒体运营", "数字媒体艺术设计"),
            0.78,
        )

    def test_rejects_competitions_and_courses_as_source_jobs(self):
        self.assertFalse(is_valid_source_job("世界技能大赛珠宝加工赛项", "首饰设计与工艺"))
        self.assertFalse(is_valid_source_job("专业核心课程", "工业机器人技术"))
        self.assertFalse(is_valid_source_job("湖南省人力资源和社会保障厅", "飞行器数字化制造技术"))
        self.assertTrue(is_valid_source_job("包装设计师", "艺术设计"))


if __name__ == "__main__":
    unittest.main()
