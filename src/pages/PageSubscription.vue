<!-- src/pages/TestApiPage.vue -->

<template>
  <q-page padding>
    <q-card>
      <q-card-section>
        <div class="text-h6">Tester les abonnements</div>

        <form @submit.prevent="subscribeToWatch">
          <BaseButton type="submit"> S'abonner à Watch</BaseButton>
        </form>
      </q-card-section>
    </q-card>

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
    const subscribeToWatch = async () => {
      console.log('subscribeToWatch');
      const getPortail = await invokeApi({
        index: 1,
        method: 'POST',
        path: '/subscriptions',
        parameters: {
          priceId: 'price_1PvGWNP4GCw0NcGs52rsGVmk',
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
