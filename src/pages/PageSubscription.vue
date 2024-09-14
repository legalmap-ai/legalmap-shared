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
  </q-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import BaseButton from '../components/BaseButton.vue';
import { invokeApi } from 'src/services/ServicesUsers';
import { Notify } from 'quasar';

export default defineComponent({
  name: 'PageSubscription',
  components: {
    BaseButton,
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
