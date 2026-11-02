<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import '../talent-plan/data.js'
import '../talent-plan/standards.js'
import '../talent-plan/model.js'
import '../talent-plan/purify.js'
import '../talent-plan/richtext.js'
import '../talent-plan/files.js'
import '../talent-plan/views.js'
import '../talent-plan/element.js'
type TalentPlanActor = { id: string; name: string; role: 'professional-lead' | 'member' }
const props = defineProps<{ mode?: 'workbench' | 'results'; actor?: TalentPlanActor; identityPreview?: boolean }>()
const emit = defineEmits<{ navigate: [detail: { view: string; section?: string }] }>()
const host = ref<HTMLElement>()
let panel: HTMLElement | undefined
const navigate = (event: Event) => emit('navigate', (event as CustomEvent).detail)
const syncActor = () => {
  const actor = props.actor || { id: 'local-professional-lead', name: '专业负责人', role: 'professional-lead' }
  panel?.setAttribute('actor-id', actor.id)
  panel?.setAttribute('actor-name', actor.name)
  panel?.setAttribute('actor-role', actor.role)
  panel?.setAttribute('identity-preview', String(props.identityPreview !== false))
}
onMounted(() => {
  panel = document.createElement('talent-plan-workbench')
  panel.setAttribute('mode', props.mode || 'workbench')
  syncActor()
  panel.addEventListener('talent-plan-navigate', navigate)
  host.value?.appendChild(panel)
})
watch(() => props.mode, mode => panel?.setAttribute('mode', mode || 'workbench'))
watch(() => [props.actor, props.identityPreview], syncActor, { deep: true })
onBeforeUnmount(() => panel?.removeEventListener('talent-plan-navigate', navigate))
</script>
<template><div ref="host" class="talent-plan-workspace-host"></div></template>
