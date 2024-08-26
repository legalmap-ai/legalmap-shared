import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/IndexPage.vue') }],
  },
  {
    path: '/BaseButton',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/BaseButton.vue') }],
  },
  {
    path: '/PageLogin',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/PageLogin.vue') }],
  },

  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
