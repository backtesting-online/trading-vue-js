import Vue from 'vue'
import App from './App.vue'

//MOB_DEBUG=true npm run test -启用移动调试
//（将控制台输出发送到 webpack 终端）
if (MOB_DEBUG) {
    console.log = debug
    console.error = debug
    console.warn = debug
}

new Vue({
  el: '#app',
  render: h => h(App)
})

function debug(...argv) {
    fetch('/debug?argv=' + JSON.stringify(argv))
}
