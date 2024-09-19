<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <router-view class="col items-stretch" />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'AuthLayout',
  setup() {
    return {};
  },
});
</script>
