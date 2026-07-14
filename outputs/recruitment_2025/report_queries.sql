-- SQLite queries used to inspect the reviewed aggregate tables behind the report.
-- The aggregate database is created from the full source CSV by analyze_recruitment.py
-- and build_artifact.py in this directory.

ATTACH DATABASE 'report_data.sqlite' AS report;

SELECT * FROM report.summary;
SELECT * FROM report.job_families ORDER BY rank;
SELECT * FROM report.job_families_salary ORDER BY "薪资中位数" DESC;
SELECT * FROM report.salary_bands ORDER BY "order";
SELECT * FROM report.top_titles ORDER BY "招聘记录" DESC;
SELECT * FROM report.education ORDER BY "招聘记录" DESC;
SELECT * FROM report.cities ORDER BY "招聘记录" DESC;
SELECT * FROM report.quality ORDER BY "数量" DESC;
