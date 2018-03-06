// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import store from './store'
import logging from './logging'
import BootstrapVue from 'bootstrap-vue'
import { Badge } from 'bootstrap-vue/es/components'
import VueMoment from 'vue-moment/vue-moment'

Vue.config.productionTip = false

Vue.use(BootstrapVue)
Vue.use(Badge)
Vue.use(VueMoment)

;(async () => {
  try {
    // pre-Vue JS bootstrap
  } catch (e) {
    // eslint-disable-next-line
    console.log(e)
  } finally {
    /* eslint-disable no-new */
    new Vue({
      el: '#app',
      store,
      router,
      logging,
      components: {App},
      template: '<App/>'
    })
  }
})()
