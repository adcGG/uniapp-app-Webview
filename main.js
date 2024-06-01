import App from './App'

// 全局添加uWeb
// #ifdef H5
import uWeb from "@/utils/uni.webview.js";
// #endif

// #ifdef H5
Vue.prototype.$uWeb = uWeb;
// #endif


// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
export function createApp() {
  const app = createSSRApp(App)
  return {
    app
  }
}
// #endif