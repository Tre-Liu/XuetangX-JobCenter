<script setup lang="ts">
withDefaults(defineProps<{ name: string; size?: number }>(), { size: 20 })
const paths: Record<string, string> = {
  book: 'M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-2H4z M20 4h-4a3 3 0 0 0-3 3v14a4 4 0 0 1 4-2h3z',
  search: 'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  chevron: 'M9 5l7 7-7 7',
  check: 'M5 12l4 4L19 6',
  video: 'M4 5h16v14H4z M10 9l5 3-5 3z',
  file: 'M14 2H5v20h14V7z M14 2v6h5 M8 12h8 M8 16h6',
  pen: 'M14 4l6 6 M4 20l4-1L21 6l-5-5L3 14z',
  spark: 'M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z',
  target: 'M21 12a9 9 0 1 1-9-9 M17 12a5 5 0 1 1-5-5 M12 12l9-9 M16 3h5v5',
  link: 'M10 13a5 5 0 0 0 7 0l4-4a5 5 0 0 0-7-7l-3 3 M14 11a5 5 0 0 0-7 0l-4 4a5 5 0 0 0 7 7l3-3',
  layers: 'M12 2L2 7l10 5 10-5z M2 12l10 5 10-5 M2 17l10 5 10-5',
  briefcase: 'M8 6V3h8v3 M3 7h18v14H3z M3 12l9 3 9-3 M12 13v4',
  send: 'M3 3l18 9-18 9 4-9z M7 12h14',
  history: 'M3 10a9 9 0 1 1 1 7 M3 4v6h6 M12 7v6l4 2',
  plus: 'M12 5v14 M5 12h14',
  close: 'M6 6l12 12 M18 6L6 18',
  arrow: 'M4 12h16 M14 6l6 6-6 6',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M12 6v6l4 2',
  back: 'M20 12H4 M10 6l-6 6 6 6',
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z'
}
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="paths[name] || paths.book" /></svg>
</template>
