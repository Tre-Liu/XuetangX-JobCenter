import {chains,normalizeConfig} from '../cms/config.mjs';
import industryRelations from './industry-relations.json' with { type: 'json' };
import {demoIndustryRelations} from './industry-demos.mjs';

// Read-only fallback also supports projects saved before industry mappings were added.
export function projectJobRelations(project,cmsConfig) {
 const design=project.learningDesign;
 const role=design?.role;
 const recorded=industryRelations.filter(row=>row.job_id===role?.id && row.cleaned_position===role?.name);
 const paths=Array.isArray(role?.industryRelations) ? role.industryRelations : recorded.length?recorded:demoIndustryRelations(role);
 const config=normalizeConfig(cmsConfig);
 const courseChains=chains.filter(chain=>config.chainIds.includes(chain.id));
 return {task:design?.sourceTask,role,paths,courseChains,courseMajor:config.major};
}
