export type CourseCivicElement = {
  id: string
  name: string
  defaultDesignMethod: string
}

export type CourseCivicDesignDraft = {
  elementId: string
  designMethod: string
}

export const defaultCourseCivicElements: CourseCivicElement[] = [
  { id: 'moral-ethics', name: '道德伦理教育', defaultDesignMethod: '' },
  { id: 'patriotic-education', name: '爱国主义教育', defaultDesignMethod: '' },
  { id: 'rule-of-law', name: '法治教育', defaultDesignMethod: '' },
  {
    id: 'social-responsibility',
    name: '社会责任教育',
    defaultDesignMethod: '结合知识点任务，引导学生识别专业实践中的社会责任。'
  },
  { id: 'scientific-culture', name: '科学文化教育', defaultDesignMethod: '' }
]

export const createCourseCivicDesignDraft = (
  elementId = 'social-responsibility',
  elements = defaultCourseCivicElements
): CourseCivicDesignDraft => ({
  elementId,
  designMethod: elements.find((element) => element.id === elementId)?.defaultDesignMethod ?? ''
})

export const selectCourseCivicElement = (
  _current: CourseCivicDesignDraft,
  elements: CourseCivicElement[],
  elementId: string
): CourseCivicDesignDraft => {
  if (!elementId) return { elementId: '', designMethod: '' }
  const element = elements.find((candidate) => candidate.id === elementId)
  if (!element) return { elementId: '', designMethod: '' }
  return { elementId: element.id, designMethod: element.defaultDesignMethod }
}

export const addCourseCivicElement = (
  elements: CourseCivicElement[],
  name: string
): CourseCivicElement[] => {
  const normalizedName = name.trim()
  if (!normalizedName || elements.some((element) => element.name === normalizedName)) return elements
  let suffix = elements.length + 1
  while (elements.some((element) => element.id === `custom-${suffix}`)) suffix += 1
  return [
    ...elements,
    { id: `custom-${suffix}`, name: normalizedName, defaultDesignMethod: '' }
  ]
}

export const updateCourseCivicElement = (
  elements: CourseCivicElement[],
  elementId: string,
  changes: Pick<CourseCivicElement, 'name' | 'defaultDesignMethod'>
): CourseCivicElement[] => {
  const normalizedName = changes.name.trim()
  if (!normalizedName) return elements
  return elements.map((element) => element.id === elementId
    ? {
        ...element,
        name: normalizedName,
        defaultDesignMethod: changes.defaultDesignMethod.trim()
      }
    : element
  )
}

export const saveCourseCivicDesign = (
  current: Record<string, CourseCivicDesignDraft>,
  knowledgeNodeName: string,
  draft: CourseCivicDesignDraft
): Record<string, CourseCivicDesignDraft> => ({
  ...current,
  [knowledgeNodeName]: { ...draft }
})
