# gangwei 数据库 ER 图覆盖清单

- 来源 PDF: `/Users/liuhongzhe/Desktop/DataDictionary_20260617172916.pdf`
- PDF 页数: 23
- 表: 17 / 17
- 视图: 0 / 0
- 字段级关系: 24 条，其中明确外键 4 条

## 表
- `capabilities`: 6 字段
- `companies`: 14 字段
- `dict_occupation`: 17 字段
- `dict_occupation_alias`: 6 字段
- `dict_occupation_class`: 11 字段
- `industry_catalogs`: 11 字段
- `jds`: 38 字段
- `job_capability_mappings`: 8 字段
- `job_industry_mappings`: 11 字段
- `job_major_mappings`: 14 字段
- `job_market_company`: 6 字段
- `job_market_insight`: 17 字段
- `job_position`: 20 字段
- `job_position_competency`: 10 字段
- `job_position_jd`: 10 字段
- `job_position_occupation`: 7 字段
- `major_catalogs`: 17 字段

## 视图

## 字段级关系
- `dict_occupation.small_class_code, taxonomy_version` -> `dict_occupation_class.class_code, taxonomy_version` (物理外键; explicit)
- `dict_occupation_alias.occupation_code, taxonomy_version` -> `dict_occupation.occupation_code, taxonomy_version` (物理外键; explicit)
- `job_market_company.insight_id` -> `job_market_insight.id` (物理外键; explicit)
- `job_position_occupation.occupation_code, taxonomy_version` -> `dict_occupation.occupation_code, taxonomy_version` (物理外键; explicit)
- `companies.representative_jd_id` -> `jds.jd_id` (业务关联; inferred)
- `job_market_company.company_id` -> `companies.company_id` (业务关联; inferred)
- `jds.company_name` -> `companies.display_name` (派生来源; inferred)
- `dict_occupation_class.parent_code, taxonomy_version` -> `dict_occupation_class.class_code, taxonomy_version` (父子层级; inferred)
- `major_catalogs.pid` -> `major_catalogs.major_catalog_id` (父子层级; inferred)
- `industry_catalogs.parent_ids` -> `industry_catalogs.id` (祖先路径; inferred)
- `job_capability_mappings.industry_id` -> `industry_catalogs.id` (业务关联; inferred)
- `job_capability_mappings.capability_id` -> `capabilities.id` (业务关联; inferred)
- `job_industry_mappings.jd_id` -> `jds.jd_id` (业务关联; inferred)
- `job_industry_mappings.industry_id` -> `industry_catalogs.id` (业务关联; inferred)
- `job_major_mappings.jd_id` -> `jds.jd_id` (业务关联; inferred)
- `job_major_mappings.major_catalog_id` -> `major_catalogs.major_catalog_id` (业务关联; inferred)
- `job_position.source_industry_catalog_id` -> `industry_catalogs.id` (业务关联; inferred)
- `job_position.primary_occupation_code, taxonomy_version` -> `dict_occupation.occupation_code, taxonomy_version` (业务关联; inferred)
- `job_position_competency.position_id, profile_version` -> `job_position.position_id, profile_version` (从属明细; inferred)
- `job_position_jd.position_id, profile_version` -> `job_position.position_id, profile_version` (桥接关联; inferred)
- `job_position_jd.jd_id` -> `jds.jd_id` (桥接关联; inferred)
- `job_position_jd.industry_id` -> `industry_catalogs.id` (桥接关联; inferred)
- `job_position_occupation.position_id, profile_version` -> `job_position.position_id, profile_version` (桥接关联; inferred)
- `job_market_insight.position_id` -> `job_position.position_id` (业务关联; inferred)
