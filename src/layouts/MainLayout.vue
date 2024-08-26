<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          LegalMap Shared Pages & Components Library
        </q-toolbar-title>

        <div>Quasar v{{ $q.version }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header> Pages & Components </q-item-label>

        <LegalmapPages
          v-for="link in linksList"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import LegalmapPages, { LegalmapPagesProps } from '../LegalmapPages.vue';

defineOptions({
  name: 'MainLayout',
});

const linksList: LegalmapPagesProps[] = [
  {
    title: 'BaseButton',
    caption: 'Basic blue button',
    icon: 'widgets',
    link: 'BaseButton',
  },
  {
    title: 'Page Login',
    caption: 'LegalMap Login Page',
    icon: 'description',
    link: 'PageLogin',
  },
];

const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
</script>
