import type { BusinessJob } from './model'
interface NodeDetailInput {
  node: { id: string; name: string; stage: string; enterpriseCount: number; techFields: string[] };
  chain: string;
  jobs: BusinessJob[];
  membership: Record<string, string>;
  companies: { name: string; creditCode: string; industry: string; products: string; address: string; scale: string }[];
}
declare global {
  var IndustryNodeDetail: { open(input: NodeDetailInput, onViewGroups?: (node: string) => void): HTMLDialogElement }
}
