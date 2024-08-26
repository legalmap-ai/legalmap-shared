<template>
  <q-page class="row items-center justify-evenly">
    <BaseButton small to="https://www.legalmap.ai" :size="18"
      >Base Button Component</BaseButton
    >
  </q-page>
</template>

<script setup lang="ts">
import BaseButton from '../components/BaseButton.vue';

defineOptions({
  name: 'IndexPage',

  setup() {
    return {};
  },
});
</script>
