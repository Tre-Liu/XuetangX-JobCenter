const cloneAbility = (ability) => ({
  name: ability.name,
  category: ability.category,
  definition: ability.definition
})

const cloneTask = (task) => ({
  name: task.name,
  description: task.description,
  abilities: [...task.abilities]
})

export const deleteAbilityReferencesFromTasks = (tasks, deletedAbilityName) =>
  tasks.map((task) => ({
    ...cloneTask(task),
    abilities: task.abilities.filter((abilityName) => abilityName !== deletedAbilityName)
  }))

export const applyAbilityEdit = ({ abilities, tasks, originalName, nextAbility }) => ({
  abilities: abilities.map((ability) =>
    ability.name === originalName ? cloneAbility(nextAbility) : cloneAbility(ability)
  ),
  tasks: tasks.map((task) => ({
    ...cloneTask(task),
    abilities: task.abilities.map((abilityName) =>
      abilityName === originalName ? nextAbility.name : abilityName
    )
  }))
})
