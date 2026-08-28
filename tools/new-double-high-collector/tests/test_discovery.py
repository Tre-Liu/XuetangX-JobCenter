import unittest

from new_double_high_collector.discovery import (
    discover_from_html,
    discover_image_sequence_from_html,
)


class DiscoveryTests(unittest.TestCase):
    def test_malformed_marked_section_does_not_abort_official_page_scan(self):
        candidates = discover_from_html(
            group_id="G009",
            major_code="500201",
            page_url="https://jwc.example.edu.cn/list.htm",
            html='''<![foo]><a href="/2025/500201.pdf">
                    道路与桥梁工程技术2025级人才培养方案</a>''',
            official_hosts={"example.edu.cn"},
        )

        self.assertEqual(len(candidates), 1)

    def test_discovers_and_deduplicates_official_vsb_page_images(self):
        candidates = discover_image_sequence_from_html(
            group_id="G008",
            major_code="500201",
            page_url="https://lq.example.edu.cn/info/1077/1489.htm",
            html='''<html><head><title>道路与桥梁工程技术专业2025级人才培养方案</title></head>
                <body>
                <img src="/virtual_attach_file.vsb?afc=A&amp;e=.png"
                     orisrc="/virtual_attach_file.vsb?afc=A&amp;e=.png">
                <img src="/virtual_attach_file.vsb?afc=B&amp;e=.png"
                     orisrc="/virtual_attach_file.vsb?afc=B&amp;e=.png">
                <img src="https://images.evil.test/page.png">
                </body></html>''',
            official_hosts={"example.edu.cn"},
        )

        self.assertEqual(len(candidates), 1)
        self.assertEqual(candidates[0].download_url, candidates[0].source_page_url)
        self.assertEqual(candidates[0].filename, "500201_2025级人才培养方案_官网页面图片合成.pdf")
        self.assertIn("官网逐页图片数：2", candidates[0].page_text)

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

    def test_discovers_official_2025_plan_zip_bundle_for_review(self):
        candidates = discover_from_html(
            group_id="G010",
            major_code="430101",
            page_url="https://www.example.edu.cn/info/1134/10338.htm",
            html='''<html><head><title>2025版人才培养方案</title></head><body>
                <a href="/system/_content/download.jsp?wbfileid=12109234">
                重庆电力高等专科学校2025版人才培养方案.zip</a>
                </body></html>''',
            official_hosts={"example.edu.cn"},
        )

        self.assertEqual(len(candidates), 1)
        self.assertEqual(
            candidates[0].filename,
            "重庆电力高等专科学校2025版人才培养方案.zip",
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

    def test_discovers_pdf_from_iframe_data_src(self):
        candidates = discover_from_html(
            group_id="G004",
            major_code="490201",
            page_url="https://www.example.edu.cn/jwc/rcpy/plan.htm",
            html='''<html><head><title>药品生产技术专业2025级人才培养方案</title></head>
                    <body><iframe src="../pdf_view/viewer.html"
                    data-src="../docs/2025-08/plan.pdf"></iframe></body></html>''',
            official_hosts={"example.edu.cn"},
        )

        self.assertEqual(len(candidates), 1)
        self.assertEqual(
            candidates[0].download_url,
            "https://www.example.edu.cn/jwc/docs/2025-08/plan.pdf",
        )

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

    def test_discovers_pdf_from_sudy_pdfsrc_attribute(self):
        candidates = discover_from_html(
            group_id="G007",
            major_code="500207",
            page_url="https://www.example.edu.cn/jwc/2025/0831/plan/page.htm",
            html='''<html><head><title>2025级智能交通技术专业人才培养方案</title></head>
                    <body><div class="wp_pdf_player"
                    pdfsrc="/_upload/article/files/5f/16/plan.pdf"
                    sudyfile-attr="{title:'智能交通技术专业人才培养方案.pdf'}"></div></body></html>''',
            official_hosts={"example.edu.cn"},
        )

        self.assertEqual(len(candidates), 1)
        self.assertEqual(
            candidates[0].download_url,
            "https://www.example.edu.cn/_upload/article/files/5f/16/plan.pdf",
        )
        self.assertEqual(candidates[0].link_text, "智能交通技术专业人才培养方案.pdf")
        self.assertEqual(candidates[0].filename, "plan.pdf")


if __name__ == "__main__":
    unittest.main()
