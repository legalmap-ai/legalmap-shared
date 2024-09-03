<!-- src/pages/TestApiPage.vue -->

<template>
  <q-page padding>
    <q-card>
      <q-card-section>
        <div class="text-h6">Tester la requête : {{ ref_selected_query.index }}</div>
        <q-btn-dropdown color="primary" label="Requêtes">
          <q-list v-model="ref_selected_query">
            <q-item v-for="query in query_tests" :key="query.index" clickable v-close-popup>
              <q-item-section @click="ref_selected_query = query">
                <q-item-label
                  >Path: {{ query.path }} - Méthode : {{ query.method }} - Paramètres:
                  {{ query.parameters }}</q-item-label
                >
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-card-section>

      <q-card-section>
        <q-btn label="Tester la requête" @click="testApi" color="primary" />
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
import { invokeApi, QueryTest } from '../services/ServicesUsers';
import { QueryError } from '../utils/api.utils';
import { translateError } from '../utils/errors.utils';

export default defineComponent({
  name: 'PageServicesUser',
  setup() {
    const groups = ref<string[]>([]);
    const error_message = ref<string | null>(null);
    const query_tests = ref<QueryTest[]>([
      {
        index: 0,
        method: 'GET',
        path: '/test',
        parameters: '?methode=GET&name=arnaud&age=43',
      },

      {
        index: 1,
        method: 'POST',
        path: '/test',
        parameters: 'je suis un simple message envoyé via POST',
      },

      {
        index: 2,
        method: 'POST',
        path: '/test',
        parameters: { methode: 'POST', name: 'arnaud', age: 43 },
      },

      {
        index: 3,
        method: 'PUT',
        path: '/test',
        parameters: { methode: 'PUT', name: 'arnaud', age: 43 },
      },
      {
        index: 4,
        method: 'DELETE',
        path: '/test',
        parameters: { methode: 'DELETE', name: 'arnaud', age: 43 },
      },
      {
        index: 5,
        method: 'error',
        path: '/test',
        parameters: { methode: 'DELETE', name: 'arnaud', age: 43 },
      },
    ]);

    const ref_selected_query = ref<QueryTest>(query_tests.value[0]);
    const testApi = async () => {
      try {
        error_message.value = null; // Reset error before fetch
        groups.value = await invokeApi(ref_selected_query.value);
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
      query_tests,
      ref_selected_query,
      testApi,
    };
  },
});
</script>

<style scoped>
.text-negative {
  color: #f44336;
}
</style>
