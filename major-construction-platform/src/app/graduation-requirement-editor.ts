export type GraduationRequirement = {
  code: string
  text: string
  children: string[]
}

export type GraduationRequirementDraft = {
  overview: string
  requirements: GraduationRequirement[]
}

const cloneRequirement = (item: GraduationRequirement, index: number): GraduationRequirement => ({
  code: `R${index + 1}`,
  text: item.text,
  children: [...item.children]
})

const cloneDraft = (draft: GraduationRequirementDraft): GraduationRequirementDraft => ({
  overview: draft.overview,
  requirements: draft.requirements.map(cloneRequirement)
})

export const createGraduationRequirementDraft = (
  overview: string,
  requirements: readonly GraduationRequirement[]
): GraduationRequirementDraft => ({
  overview,
  requirements: requirements.map(cloneRequirement)
})

export const addGraduationRequirement = (
  draft: GraduationRequirementDraft
): GraduationRequirementDraft => {
  const next = cloneDraft(draft)
  next.requirements.push({ code: `R${next.requirements.length + 1}`, text: '', children: [] })
  return next
}

export const removeGraduationRequirement = (
  draft: GraduationRequirementDraft,
  requirementIndex: number
): GraduationRequirementDraft => ({
  overview: draft.overview,
  requirements: draft.requirements
    .filter((_, index) => index !== requirementIndex)
    .map(cloneRequirement)
})

export const addGraduationRequirementChild = (
  draft: GraduationRequirementDraft,
  requirementIndex: number
): GraduationRequirementDraft => {
  const next = cloneDraft(draft)
  next.requirements[requirementIndex]?.children.push('')
  return next
}

export const removeGraduationRequirementChild = (
  draft: GraduationRequirementDraft,
  requirementIndex: number,
  childIndex: number
): GraduationRequirementDraft => {
  const next = cloneDraft(draft)
  if (next.requirements[requirementIndex]) {
    next.requirements[requirementIndex].children = next.requirements[requirementIndex].children
      .filter((_, index) => index !== childIndex)
  }
  return next
}

export const moveGraduationRequirement = (
  draft: GraduationRequirementDraft,
  fromIndex: number,
  toIndex: number
): GraduationRequirementDraft => {
  const next = cloneDraft(draft)
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= next.requirements.length ||
    toIndex >= next.requirements.length ||
    fromIndex === toIndex
  ) return next

  const [moved] = next.requirements.splice(fromIndex, 1)
  next.requirements.splice(toIndex, 0, moved)
  next.requirements = next.requirements.map(cloneRequirement)
  return next
}

export const saveGraduationRequirementDraft = (
  draft: GraduationRequirementDraft
): GraduationRequirementDraft => ({
  overview: draft.overview.trim(),
  requirements: draft.requirements.map((item, index) => ({
    code: `R${index + 1}`,
    text: item.text.trim(),
    children: item.children.map((child) => child.trim())
  }))
})
