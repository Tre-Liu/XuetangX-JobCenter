export type CourseMedia = {
  src: string
  durationSeconds: number
  poster: string
}

// Vite replaces BASE_URL with "./" in the distributable. Relative media URLs
// continue to resolve beside the inlined dist/index.html over the file protocol.
const mediaRoot = `${import.meta.env?.BASE_URL ?? './'}course-media/`
const mediaIds = ['limit-introduction', 'derivative-meaning', 'monotonicity-extrema'] as const
const mediaByUnit = new Map<string, CourseMedia>(mediaIds.map(id => [id, {
  src: `${mediaRoot}${id}.mp4`,
  poster: `${mediaRoot}${id}.png`,
  durationSeconds: 36
}]))

export const getCourseMedia = (unitId: string): CourseMedia | undefined => mediaByUnit.get(unitId)
