const asset = (id, primaryValue, totalValue, supportingMetrics = []) => ({
  id,
  label: id,
  primaryValue,
  ...(totalValue === undefined ? {} : {
    totalValue,
    coverageRate: primaryValue / totalValue,
  }),
  status: id === 'recruitment' ? 'in_progress' : 'partial',
  definition: `${id} test definition`,
  grain: `${id} test grain`,
  sourceIds: [],
  supportingMetrics,
})

export const validSnapshotFixture = {
  schemaVersion: 1,
  generatedAt: '2026-07-27T00:00:00.000Z',
  workspaceRootLabel: 'fixture',
  overallStatus: 'partial',
  assets: [
    asset('chains', 2, 3),
    asset('stages', 1),
    asset('majors', 1, 2),
    asset('industries', 2, 2),
    asset('positions', 3, 4, [
      { label: '未匹配岗位', value: 1 },
      { label: '岗位—节点关系', value: 3 },
      { label: '建议复核关系', value: 1 },
    ]),
    asset('recruitment', 8, 10),
  ],
  recruitmentPipeline: {
    inputRows: 10,
    validUniqueRows: 8,
    duplicateRows: 1,
    invalidRows: 1,
    formallyMatchedJobs: 2,
    mediumReviewJobs: 3,
    unmatchedRows: 3,
    formalRelationCount: 2,
    completedYears: [2014, 2016],
  },
  sources: [],
  warnings: [],
}

export function currentBaselineFixture() {
  const snapshot = structuredClone(validSnapshotFixture)
  const assets = Object.fromEntries(snapshot.assets.map((asset) => [asset.id, asset]))

  Object.assign(assets.chains, {
    primaryValue: 19,
    totalValue: 129,
    coverageRate: 19 / 129,
  })
  assets.stages.primaryValue = 57
  assets.stages.supportingMetrics = [{ label: '10链精细节点', value: 1133 }]
  Object.assign(assets.majors, {
    primaryValue: 682,
    totalValue: 2142,
    coverageRate: 682 / 2142,
  })
  Object.assign(assets.industries, {
    primaryValue: 1955,
    totalValue: 1955,
    coverageRate: 1,
  })
  Object.assign(assets.positions, {
    primaryValue: 645,
    totalValue: 1356,
    coverageRate: 645 / 1356,
    supportingMetrics: [
      { label: '未匹配岗位', value: 711 },
      { label: '岗位—节点关系', value: 782 },
      { label: '建议复核关系', value: 19 },
    ],
  })
  Object.assign(assets.recruitment, {
    primaryValue: 239149,
    totalValue: 240034,
    coverageRate: 239149 / 240034,
  })
  Object.assign(snapshot.recruitmentPipeline, {
    inputRows: 240034,
    validUniqueRows: 239149,
    duplicateRows: 700,
    invalidRows: 185,
    formallyMatchedJobs: 19297,
    mediumReviewJobs: 20000,
    unmatchedRows: 199852,
    completedYears: [2014, 2015, 2016],
  })

  return snapshot
}
