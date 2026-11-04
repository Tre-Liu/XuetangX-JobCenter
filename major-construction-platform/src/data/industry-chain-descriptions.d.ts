export {}
declare global {
  var IndustryChainDescriptions: {
    chains: Array<{ name: string; description: string }>
    profiles: Array<{ id: string; name: string; description: string }>
    byName: Record<string, string>
    byProfileId: Record<string, string>
  }
}
