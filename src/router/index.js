import Vue from 'vue';
import Router from 'vue-router';
import Dashboard from '@/components/Dashboard';
import Account from '@/components/Account';
import Token from '@/components/Token';
import KYC from '@/components/KYC';
import Vault from '@/components/Vault';

Vue.use(Router);

export default new Router({
  mode: 'history',
  linkActiveClass: 'is-active',
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: Dashboard
    },
    {
      path: '/account',
      name: 'account',
      component: Account
    },
    {
      path: '/token',
      name: 'token',
      component: Token
    },
    {
      path: '/kyc',
      name: 'kyc',
      component: KYC
    },
    {
      path: '/vault',
      name: 'vault',
      component: Vault
    }
  ]
});
