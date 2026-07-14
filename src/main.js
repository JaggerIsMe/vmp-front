import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'

import App from './App.vue'
import router from './router'
import './assets/styles/base.scss'
import './assets/styles/login.page.scss'
import './assets/styles/user.info.scss'
import './assets/styles/user.management.scss'
import './assets/styles/role.management.scss'

import Verify from './utils/Verify'
import Message from './utils/Message'
import Request from './utils/Request'
import Confirm from './utils/Confirm'
import Utils from './utils/Utils'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus, {
  locale: zhCn,
})

app.mount('#app')
