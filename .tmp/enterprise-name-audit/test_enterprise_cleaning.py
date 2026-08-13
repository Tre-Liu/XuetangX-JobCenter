import unittest

from enterprise_cleaning import aggregate_records, classify_record


class EnterpriseCleaningRuleTests(unittest.TestCase):
    def test_placeholder_is_quarantined(self):
        result = classify_record("-", "", "存续")
        self.assertEqual(result["record_action"], "QUARANTINE")
        self.assertEqual(result["name_quality_status"], "INVALID")
        self.assertIn("EMPTY_OR_PLACEHOLDER", result["reason_codes"])
        self.assertIsNone(result["company_name_clean"])

    def test_credit_code_as_name_is_quarantined(self):
        result = classify_record("91371423MA3F8CG55G", "91371423MA3F8CG55G", "存续")
        self.assertEqual(result["record_action"], "QUARANTINE")
        self.assertIn("CREDIT_CODE_AS_NAME", result["reason_codes"])
        self.assertIsNone(result["company_name_clean"])

    def test_judicial_invalid_notice_extracts_credit_and_quarantines(self):
        result = classify_record(
            "91440300053864005T（企业名称已被人民法院认定不适宜）",
            "",
            "存续",
        )
        self.assertEqual(result["credit_code_clean"], "91440300053864005T")
        self.assertEqual(result["record_action"], "QUARANTINE")
        self.assertIn("JUDICIAL_NAME_INVALID", result["reason_codes"])
        self.assertIsNone(result["company_name_clean"])

    def test_former_name_note_is_split_from_current_name(self):
        result = classify_record(
            "泰州市华志珹智能科技有限公司(曾用名:江苏华志珹智能科技有限公司)",
            "91321204MA1MU8M8X4",
            "存续",
        )
        self.assertEqual(result["company_name_clean"], "泰州市华志珹智能科技有限公司")
        self.assertEqual(result["former_company_names"], ["江苏华志珹智能科技有限公司"])
        self.assertEqual(result["record_action"], "KEEP_CLEANED")
        self.assertIn("FORMER_NAME_MIXED", result["reason_codes"])

    def test_inactive_registration_is_hidden(self):
        result = classify_record("南京汇兴博业数字设备有限公司", "913201057453873855", "注销")
        self.assertEqual(result["registration_status_group"], "INACTIVE")
        self.assertEqual(result["record_action"], "HIDE")
        self.assertIn("INACTIVE_REGISTRATION", result["reason_codes"])

    def test_unknown_registration_is_reviewed(self):
        result = classify_record("某某科技有限公司", "913201057453873855", "-")
        self.assertEqual(result["registration_status_group"], "UNKNOWN")
        self.assertEqual(result["record_action"], "REVIEW")
        self.assertIn("UNKNOWN_REGISTRATION_STATUS", result["reason_codes"])

    def test_numeric_brand_inside_legal_name_is_not_rejected(self):
        result = classify_record("360安全科技股份有限公司", "913201057453873855", "存续")
        self.assertEqual(result["record_action"], "KEEP")
        self.assertNotIn("NUMERIC_ONLY_NAME", result["reason_codes"])

    def test_status_note_is_split_and_registration_conflict_reviewed(self):
        result = classify_record("兖矿峄山化工有限公司(破产清算)", "91370883MA3D14TT2M", "存续")
        self.assertEqual(result["company_name_clean"], "兖矿峄山化工有限公司")
        self.assertEqual(result["record_action"], "REVIEW")
        self.assertIn("STATUS_MIXED_IN_NAME", result["reason_codes"])
        self.assertIn("NAME_STATUS_CONFLICT", result["reason_codes"])


class EnterpriseAggregationTests(unittest.TestCase):
    def test_same_credit_code_merges_sources_and_flags_name_conflict(self):
        records = [
            {
                "name": "甲科技有限公司",
                "credit": "913201057453873855",
                "status": "存续",
                "source_file": "A.xlsx",
                "source_sheet": "基础信息",
                "source_row": 2,
            },
            {
                "name": "乙科技有限公司",
                "credit": "913201057453873855",
                "status": "存续",
                "source_file": "B.xlsx",
                "source_sheet": "信息匹配",
                "source_row": 3,
            },
        ]
        entities = aggregate_records(records)
        self.assertEqual(len(entities), 1)
        entity = entities[0]
        self.assertEqual(entity["source_count"], 2)
        self.assertEqual(set(entity["all_names"]), {"甲科技有限公司", "乙科技有限公司"})
        self.assertEqual(entity["record_action"], "REVIEW")
        self.assertIn("MULTIPLE_NAMES_FOR_CREDIT_CODE", entity["reason_codes"])


if __name__ == "__main__":
    unittest.main()
