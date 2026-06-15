type JobAbilityRecord = {
  name: string
  category: '知识' | '技能' | '素养'
  definition: string
}

type JobTaskRecord = {
  name: string
  description: string
  abilities: string[]
}

export function deleteAbilityReferencesFromTasks(
  tasks: JobTaskRecord[],
  deletedAbilityName: string
): JobTaskRecord[]

export function applyAbilityEdit(input: {
  abilities: JobAbilityRecord[]
  tasks: JobTaskRecord[]
  originalName: string
  nextAbility: JobAbilityRecord
}): {
  abilities: JobAbilityRecord[]
  tasks: JobTaskRecord[]
}
