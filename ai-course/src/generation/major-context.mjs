import directory from './official-majors.json' with {type:'json'};
export {directory};
export const officialMajors=directory.majors;
const byCode=new Map(officialMajors.map(m=>[m.code,m]));
export const findMajor=code=>byCode.get(code);

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
