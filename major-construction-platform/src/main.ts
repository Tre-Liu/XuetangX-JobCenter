import { createApp } from 'vue'
import './styles.css'
import App from './App.vue'

globalThis.IndustryCmsBridge.consume()
const legacyCmsUrl = globalThis.IndustryCmsBridge.legacyRedirectUrl()
if (legacyCmsUrl) window.location.replace(legacyCmsUrl)
else createApp(App).mount('#app')
