// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import App from './App';
import router from './router';
import store from './store';
import logging from './logging';
import VueMoment from 'vue-moment/vue-moment';
import Vuetify from 'vuetify';

import 'vue-awesome/icons';
import Icon from 'vue-awesome/components/Icon';
import 'vuetify/dist/vuetify.min.css';

Vue.config.productionTip = false;

Vue.use(VueMoment);
Vue.use(Vuetify);

Vue.component('icon', Icon);

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
    });
  }
})();
