import {matchMajorJobs as matchCoreJobs} from './matching.mjs';
import {jobTaskDemos} from './job-task-examples.mjs';
// Course counts reflect its actual task library; identity and fallback rules are shared.
export function matchMajorJobs(major) {
  return matchCoreJobs(major).map(job => {
    const tasks = jobTaskDemos(job);
    return tasks.length ? {...job, taskCount:tasks.length, abilityCount:tasks.reduce((sum,task)=>sum+task.abilities.length,0)} : job;
  });
}
