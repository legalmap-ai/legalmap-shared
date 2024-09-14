<template>
  <button class="button" :class="getClass" :style="getStyle" @click="handleClick">
    <slot></slot>
    <!-- <img v-if="props.icon" :src="props.icon" alt="icon" /> -->
  </button>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    hj: any;
  }
}

const props = defineProps<{
  id?: string;
  rounded?: boolean;
  icon?: string;
  size?: number;
  small?: boolean;
  to?: string;
  secondary?: boolean;
}>();

const getStyle = {
  fontSize: props.size ? `${props.size}px` : '12px',
};

const getClass = {
  rounded: props.rounded,
  small: props.small,
  secondary: props.secondary,
};

const router = useRouter();

const handleClick = () => {
  if (props.to?.startsWith('http')) {
    window.open(props.to, '_blank');
  } else if (props.to) {
    router.push(props.to);
  }

  if (props.id) {
    if (window.hj) {
      window.hj('event', 'event-button-click-' + props.id);
    }
  }
};
</script>

<style lang="scss" scoped>
.button {
  background-color: $blue;
  color: white;
  border-radius: 6px;
  padding: 10px 20px;
  cursor: pointer;
  border: none;
  outline: none;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  transition: 0.2s;

  &.rounded {
    border-radius: 100px;
  }

  &.small {
    padding: 5px 10px;
  }

  &.secondary {
    background-color: transparent;
    color: #9797a5;
  }

  &:hover {
    background-color: darken($blue, 10%);

    &.secondary {
      background-color: lighten(black, 10%);
    }
  }
}
</style>
