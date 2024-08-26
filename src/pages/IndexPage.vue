<template>
  <q-page class="row items-center justify-evenly"> LegalMap Logo </q-page>

  <q-page class="row items-center justify-evenly">
    <BaseButton
      icon="widgets"
      to="https://www.legalmap.ai"
      caption="Hello"
      title="BaseButton"
    />
  </q-page>
</template>

<script setup lang="ts">
import BaseButton from '../components/BaseButton.vue';

defineOptions({
  name: 'IndexPage',
  components: {
    BaseButton,
  },

  setup() {
    return {};
  },
});
</script>
