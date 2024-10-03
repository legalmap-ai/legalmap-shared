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
    path: '/login',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/PageLogin.vue') }],
  },
  {
    path: '/register',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/PageRegister.vue') }],
  },
  {
    path: '/reset',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/PageReset.vue') }],
  },
  {
    path: '/profile',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/PageProfile.vue') }],
  },
  {
    path: '/services-users',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/PageServicesUser.vue') }],
  },
  {
    path: '/services-pdfs',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/PageServicesPdfs.vue') }],
  },
  {
    path: '/clients',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/PageClients.vue') }],
  },

  {
    path: '/socket-services-users',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/PageSocketServicesUser.vue') }],
  },
  {
    path: '/subscription',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/PageSubscription.vue') }],
  },
  {
    path: '/organizations',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/PageOrganizations.vue') }],
  },
  {
    path: '/reclaim-advantage',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/PageReclaimAdvantage.vue') }],
  },
  {
    path: '/generate-code',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/PageGenerateCode.vue') }],
  },
  {
    path: '/my-organization',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/PageMyOrganization.vue') }],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
