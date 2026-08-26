import unittest

from new_double_high_collector.discovery import discover_from_html


class DiscoveryTests(unittest.TestCase):
    def test_keeps_official_attachment_and_rejects_external_reprint(self):
        candidates = discover_from_html(
            group_id="G001",
            major_code="460301",
            page_url="https://jwc.example.edu.cn/notice/1.html",
            html='''<html><head><title>培养方案公示</title></head><body>
                <a href="/files/2025-460301.pdf">机电一体化技术2025级人才培养方案</a>
                <a href="https://wenku.example.com/copy.pdf">转载</a>
                </body></html>''',
            official_hosts={"example.edu.cn"},
        )

        self.assertEqual(len(candidates), 1)
        self.assertEqual(
            candidates[0].download_url,
            "https://jwc.example.edu.cn/files/2025-460301.pdf",
        )
        self.assertEqual(candidates[0].link_text, "机电一体化技术2025级人才培养方案")

    def test_resolves_encoded_docx_link_and_drops_javascript(self):
        candidates = discover_from_html(
            group_id="G002",
            major_code="510203",
            page_url="https://www.example.edu.cn/jwc/list/index.html",
            html='''<a href="../files/%E8%BD%AF%E4%BB%B6%E6%8A%80%E6%9C%AF2025.docx">下载</a>
                    <a href="javascript:void(0)">无效</a>''',
            official_hosts={"example.edu.cn"},
        )

        self.assertEqual(len(candidates), 1)
        self.assertTrue(candidates[0].download_url.endswith("/jwc/files/%E8%BD%AF%E4%BB%B6%E6%8A%80%E6%9C%AF2025.docx"))

    def test_accepts_dynamic_download_url_when_anchor_names_a_supported_file(self):
        candidates = discover_from_html(
            group_id="G003",
            major_code="460305",
            page_url="https://www.example.edu.cn/plans",
            html='''<a href="/system/_content/download.jsp?wbfileid=ABC">
                    460305工业机器人技术专业2025级人才培养方案.pdf</a>''',
            official_hosts={"example.edu.cn"},
        )

        self.assertEqual(len(candidates), 1)
        self.assertEqual(
            candidates[0].filename,
            "460305工业机器人技术专业2025级人才培养方案.pdf",
        )

    def test_discovers_pdf_embedded_in_iframe(self):
        candidates = discover_from_html(
            group_id="G004",
            major_code="460103",
            page_url="https://jwc.example.edu.cn/info/1129/4576.htm",
            html='''<html><head><title>数控技术-2025版专业人才培养方案</title></head>
                    <body><iframe src="/__local/A/B/plan.pdf"></iframe></body></html>''',
            official_hosts={"example.edu.cn"},
        )

        self.assertEqual(len(candidates), 1)
        self.assertEqual(
            candidates[0].download_url,
            "https://jwc.example.edu.cn/__local/A/B/plan.pdf",
        )
        self.assertEqual(candidates[0].link_text, "")

    def test_unwraps_pdfjs_iframe_file_parameter(self):
        candidates = discover_from_html(
            group_id="G005",
            major_code="460103",
            page_url="https://jwc.example.edu.cn/info/1129/4576.htm",
            html='''<html><head><title>数控技术-2025版专业人才培养方案</title></head>
                    <body><iframe src="/system/resource/pdfjs/viewer.html?file=/__local/A/B/plan.pdf"></iframe></body></html>''',
            official_hosts={"example.edu.cn"},
        )

        self.assertEqual(len(candidates), 1)
        self.assertEqual(
            candidates[0].download_url,
            "https://jwc.example.edu.cn/__local/A/B/plan.pdf",
        )

    def test_discovers_pdf_rendered_by_vsb_iframe_script(self):
        candidates = discover_from_html(
            group_id="G006",
            major_code="520601",
            page_url="https://hzyxy.example.edu.cn/info/1102/15653.htm",
            html='''<html><head><title>2025级康复治疗技术专业人才培养方案</title></head>
                    <body><script>showVsbpdfIframe("/__local/2/30/25/plan.pdf","100%","600");</script></body></html>''',
            official_hosts={"example.edu.cn"},
        )

        self.assertEqual(len(candidates), 1)
        self.assertEqual(
            candidates[0].download_url,
            "https://hzyxy.example.edu.cn/__local/2/30/25/plan.pdf",
        )


if __name__ == "__main__":
    unittest.main()
