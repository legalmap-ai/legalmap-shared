<template>
  <q-item clickable tag="a" target="_blank" @click="handleClick">
    <q-item-section v-if="icon" avatar>
      <q-icon :name="icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ title }}</q-item-label>
      <q-item-label caption>{{ caption }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'LegalmapPages',
  props: {
    title: String,
    caption: String,
    icon: String,
    link: String,
  },
  setup(props) {
    const router = useRouter();
    const handleClick = () => {
      if (props.link) {
        router.push(props.link);
      }
    };
    return { handleClick };
  },
});

export type LegalmapPagesProps = {
  title: string;
  caption: string;
  icon: string;
  link: string;
};
</script>
