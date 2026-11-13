import {findMajor} from '../../../packages/industry-core/catalog.mjs';
export {directory, officialMajors, findMajor} from '../../../packages/industry-core/catalog.mjs';

// The course binding is supplied by the course, never inferred from wizard drafts.
export function resolveCourseContext(draft={},courseMajor=null){
 const c={...draft};
 const code=courseMajor?.code||c.major;
 const official=findMajor(code);
 c.major=code||'';
 c.majorName=courseMajor?.name||official?.name||'';
 if(courseMajor?.code&&c.planId&&c.planMajor!==code){
  delete c.planId;delete c.planMajor;delete c.planName;
 }
 return c;
}
