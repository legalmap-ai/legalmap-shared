<!-- src/pages/TestApiPage.vue -->

<template>
  <q-page padding>
    <q-card>
      <q-card-section>
        <div class="text-h6">Test API: User Groups</div>
      </q-card-section>

      <q-card-section>
        <q-btn label="Fetch User Groups" @click="fetchUserGroups" color="primary" />
      </q-card-section>

      <q-card-section v-if="error_message" class="text-negative">
        Erreur: {{ error_message }}
      </q-card-section>

      <q-card-section v-if="groups.length">
        <div v-for="group in groups" :key="group" class="q-mb-sm">
          {{ group }}
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { getUserGroups } from '../services/ServicesUsers';
import { QueryError } from '../utils/api.utils';
import { translateError } from '../utils/errors.utils';

export default defineComponent({
  name: 'PageServicesUser',
  setup() {
    const groups = ref<string[]>([]);
    const error_message = ref<string | null>(null);

    const fetchUserGroups = async () => {
      try {
        error_message.value = null; // Reset error before fetch
        groups.value = await getUserGroups();
      } catch (error) {
        const translated_error = translateError(error as QueryError);
        console.log(translated_error);
        const errorDetails =
          (error as QueryError).response?.data || (error as QueryError).message || error;
        error_message.value =
          'API call failed: ' +
          (typeof errorDetails === 'object' ? JSON.stringify(errorDetails, null, 2) : errorDetails);
      }
    };

    return {
      groups,
      error_message,
      fetchUserGroups,
    };
  },
});
</script>

<style scoped>
.text-negative {
  color: #f44336;
}
</style>
