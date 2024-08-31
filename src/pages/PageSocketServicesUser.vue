<!-- src/pages/TestApiPage.vue -->

<template>
  <q-page padding>
    <q-card>
      <q-card-section>
        <div class="text-h6">Service Connect</div>
        <div><q-btn label="CONNECT" @click="fetchServiceConnect" color="primary" /></div>
      </q-card-section>

      <q-card-section v-if="error_message" class="text-negative">
        Erreur: {{ error_message }}
      </q-card-section>

      <q-card-section> Socket response : {{ socketResponse }} </q-card-section>
    </q-card>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { connect_socket_api_gateway } from '../services/ServicesSocketUsers';
import { QueryError } from '../utils/api.utils';
import { translateError } from '../utils/errors.utils';

export default defineComponent({
  name: 'PageSocketServicesUser',
  setup() {
    const socketResponse = ref<string>('');
    const error_message = ref<string | null>(null);

    const fetchServiceConnect = async () => {
      try {
        error_message.value = null; // Reset error before fetch
        socketResponse.value = await connect_socket_api_gateway();
        debugger;
      } catch (error) {
        debugger;
        const translated_error = translateError(error as QueryError);
        console.log(translated_error);
        const errorDetails =
          (error as QueryError).response?.data || (error as QueryError).message || error;
        error_message.value =
          'Socket service API call failed: ' +
          (typeof errorDetails === 'object' ? JSON.stringify(errorDetails, null, 2) : errorDetails);
      }
    };

    return {
      socketResponse,
      error_message,
      fetchServiceConnect,
    };
  },
});
</script>

<style scoped>
.text-negative {
  color: #f44336;
}
</style>
