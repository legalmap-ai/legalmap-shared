<!-- src/pages/TestApiPage.vue -->

<template>
  <q-page padding>
    <Pricing />
  </q-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import BaseButton from '../components/BaseButton.vue';
import { invokeApi } from '../services/ServicesUsers';
import { Notify } from 'quasar';
import Pricing from 'src/components/Pricing.vue';

export default defineComponent({
  name: 'PageSubscription',
  components: {
    BaseButton,
    Pricing,
  },
  setup() {
    const subscribeToWatch = async (priceId: string) => {
      const getPortail = await invokeApi({
        index: 1,
        method: 'POST',
        path: '/subscriptions',
        parameters: {
          priceId,
        },
        useQueryString: false,
        forceRefreshToken: false,
      });

      if (getPortail.session_url) {
        window.location.href = getPortail.session_url;
      } else {
        Notify.create({
          message: "Une erreur s'est produite",
          color: 'negative',
        });
      }
    };

    return {
      subscribeToWatch,
    };
  },
});
</script>
