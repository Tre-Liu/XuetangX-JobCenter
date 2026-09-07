import industryRelations from './industry-relations.json' with { type: 'json' };

// Read-only fallback also supports projects saved before industry mappings were added.
export function projectJobRelations(project) {
 const design=project.learningDesign;
 const role=design?.role;
 const paths=Array.isArray(role?.industryRelations) ? role.industryRelations : industryRelations.filter(row=>row.job_id===role?.id && row.cleaned_position===role?.name);
 return {task:design?.sourceTask,role,paths};
}
