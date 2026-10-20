<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { getCourseMedia } from '../data/course-media'
import type { LearningUnit } from '../data/learning-space'

const props = defineProps<{ unit: LearningUnit }>()
const emit = defineEmits<{ confused: [] }>()
const media = computed(() => getCourseMedia(props.unit.id))
const videoElement = ref<HTMLVideoElement | null>(null)
const isPlaying = ref(false)
const playbackRate = ref('1')
const playbackError = ref('')
let pendingSeek: number | undefined

const timeLabel = computed(() => {
  const seconds = media.value?.durationSeconds ?? 0
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
})

const applyPlaybackRate = () => {
  if (videoElement.value) videoElement.value.playbackRate = Number(playbackRate.value)
}

const seekTo = (seconds: number) => {
  const video = videoElement.value
  if (!video || !Number.isFinite(seconds)) return
  const duration = Number.isFinite(video.duration) ? video.duration : media.value?.durationSeconds ?? 0
  const target = Math.min(Math.max(0, seconds), Math.max(0, duration - 0.05))
  if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
    pendingSeek = target
    return
  }
  video.currentTime = target
}

const onLoadedMetadata = () => {
  playbackError.value = ''
  applyPlaybackRate()
  if (pendingSeek !== undefined) {
    const target = pendingSeek
    pendingSeek = undefined
    seekTo(target)
  }
}

const play = async () => {
  const video = videoElement.value
  if (!video) return
  playbackError.value = ''
  try {
    await video.play()
  } catch {
    if (videoElement.value === video) playbackError.value = '视频暂时无法播放，请重试。'
  }
}

const retry = () => {
  playbackError.value = ''
  videoElement.value?.load()
}

watch(() => props.unit.id, async () => {
  videoElement.value?.pause()
  isPlaying.value = false
  playbackError.value = ''
  playbackRate.value = '1'
  pendingSeek = undefined
  await nextTick()
  videoElement.value?.load()
}, { flush: 'pre' })

onBeforeUnmount(() => videoElement.value?.pause())
defineExpose({ seekTo })
</script>

<template>
  <section class="course-video-player" :aria-label="`${unit.title}视频播放器`">
    <div class="course-video-frame">
      <template v-if="media">
        <video
          :key="unit.id"
          ref="videoElement"
          :src="media.src"
          :poster="media.poster"
          :aria-label="`${unit.title}教学视频`"
          controls
          playsinline
          preload="metadata"
          @loadedmetadata="onLoadedMetadata"
          @play="isPlaying = true"
          @pause="isPlaying = false"
          @ended="isPlaying = false"
          @error="playbackError = '视频加载失败，请重试。'"
        ></video>
        <button v-if="!isPlaying && !playbackError" class="course-video-play" type="button" :aria-label="`播放${unit.title}`" @click="play">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 11 7-11 7z" fill="currentColor" /></svg>
        </button>
        <div v-if="playbackError" class="course-video-error" role="status"><p>{{ playbackError }}</p><button type="button" @click="retry">重新加载</button></div>
      </template>
      <p v-else class="course-video-unavailable">暂无可播放的视频</p>
    </div>
    <div class="course-video-toolbar">
      <span class="course-video-meta">图形讲解<span aria-hidden="true"> · </span>{{ timeLabel }}<span aria-hidden="true"> · </span>无声</span>
      <div class="course-video-actions">
        <label class="course-video-speed">倍速<select v-model="playbackRate" aria-label="视频播放倍速" @change="applyPlaybackRate"><option value="0.75">0.75×</option><option value="1">1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label>
        <button class="course-video-confused" type="button" @click="emit('confused')"><span aria-hidden="true">✦</span> AI 不懂</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.course-video-player { width: 100%; min-width: 0; overflow: hidden; border-radius: 12px; background: #080d16; color: #fff; }
.course-video-frame { position: relative; aspect-ratio: 16 / 9; background: #000; }
.course-video-frame video { display: block; width: 100%; height: 100%; object-fit: contain; }
.course-video-play { position: absolute; top: 50%; left: 50%; display: grid; place-items: center; width: 70px; height: 70px; padding: 0; border: 1px solid #ffffff70; border-radius: 50%; background: #111d32c9; color: #fff; cursor: pointer; transform: translate(-50%, -50%); box-shadow: 0 8px 32px #0004; }
.course-video-play svg { width: 36px; height: 36px; margin-left: 2px; }
.course-video-play:hover { background: #3268d9ed; }
.course-video-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 48px; padding: 8px 14px; }
.course-video-meta { color: #b8c5d8; font-size: 12px; }
.course-video-actions { display: flex; align-items: center; gap: 14px; }
.course-video-speed { display: flex; align-items: center; gap: 6px; color: #c7d2e1; font-size: 12px; }
.course-video-speed select { padding: 4px 7px; border: 1px solid #39485f; border-radius: 5px; background: #172338; color: #fff; font: inherit; }
.course-video-confused { display: flex; align-items: center; gap: 5px; min-height: 32px; padding: 5px 12px; border: 1px solid #5b82df; border-radius: 7px; background: #244eaa; color: #fff; font-family: inherit; font-size: 12px; font-weight: 600; line-height: 1.4; cursor: pointer; }
.course-video-confused:hover { background: #3264c9; }
.course-video-confused span { color: #dce9ff; }
.course-video-error, .course-video-unavailable { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 10px; margin: 0; background: #07101bd9; color: #d6e2f1; font-size: 14px; }
.course-video-error p { margin: 0; }
.course-video-error button { padding: 7px 13px; border: 1px solid #637895; border-radius: 6px; background: #172b47; color: #fff; cursor: pointer; }
.course-video-player button:focus-visible, .course-video-player select:focus-visible { outline: 3px solid #81acff; outline-offset: 3px; }
@media (max-width: 520px) { .course-video-toolbar { flex-wrap: wrap; gap: 8px; padding: 8px 10px; } .course-video-actions { margin-left: auto; gap: 10px; } .course-video-play { width: 54px; height: 54px; } .course-video-play svg { width: 29px; height: 29px; } }
</style>
