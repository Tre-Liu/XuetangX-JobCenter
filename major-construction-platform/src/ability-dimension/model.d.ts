export {}
declare global {
  var AbilityDimensionModel: {
    context(url: URL, options?: {catalogAvailable: boolean}): {major: string; scope: string; skills: string[]; courses: string[]}
  }
}
