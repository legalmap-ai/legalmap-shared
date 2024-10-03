<template>
  <div class="q-pa-xl">
    <ReclaimAdvantage />
  </div>
</template>

<script lang="ts">
import ReclaimAdvantage from 'src/components/ReclaimAdvantage.vue';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'PageReclaimAdvantage',
  components: {
    ReclaimAdvantage,
  },
});
</script>
