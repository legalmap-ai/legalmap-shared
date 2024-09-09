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
                  {{ query.parameters }} - UQS : {{ query.useQueryString }} - Refresh
                  {{ query.forceRefreshToken }}</q-item-label
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

      <q-card-section v-if="messageApi.length">
        <div v-for="group in messageApi" :key="group" class="q-mb-sm">
          {{ group }}
        </div>
      </q-card-section>

      <q-card-section>
        <q-btn label="Tester la requête Socket" @click="testSocketApi" color="primary" />
      </q-card-section>

      <q-card-section v-if="messageSocketApi.length">
        <div v-for="group in messageSocketApi" :key="group" class="q-mb-sm">
          {{ group }}
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { invokeApi, invokeSocketApi, QueryTest } from '../services/ServicesUsers';
import { QueryError } from '../utils/api.utils';
import { translateError } from '../utils/errors.utils';

export default defineComponent({
  name: 'PageServicesUser',
  setup() {
    const messageApi = ref<string[]>([]);
    const messageSocketApi = ref<string[]>([]);

    const error_message = ref<string | null>(null);
    const query_tests = ref<QueryTest[]>([
      {
        index: 0,
        method: 'GET',
        path: '/test',
        parameters: '?methode=GET&name=arnaud&age=43',
        useQueryString: true,
        forceRefreshToken: false,
      },
      {
        index: 1,
        method: 'GET',
        path: '/test',
        parameters: '?methode=GET&name=arnaud&age=43',
        useQueryString: true,
        forceRefreshToken: true,
      },
      {
        index: 2,
        method: 'GET',
        path: '/test',
        parameters: '?methode=GET&name=arnaud&age=43',
        useQueryString: false,
        forceRefreshToken: false,
      },

      {
        index: 3,
        method: 'POST',
        path: '/test',
        parameters: 'je suis un simple message envoyé via POST',
        useQueryString: false,
        forceRefreshToken: false,
      },

      {
        index: 4,
        method: 'POST',
        path: '/test',
        parameters: { methode: 'POST', name: 'arnaud', age: 43 },
        useQueryString: false,
        forceRefreshToken: false,
      },

      {
        index: 5,
        method: 'PUT',
        path: '/test',
        parameters: { methode: 'PUT', name: 'arnaud', age: 43 },
        useQueryString: false,
        forceRefreshToken: false,
      },
      {
        index: 6,
        method: 'DELETE',
        path: '/test',
        parameters: { methode: 'DELETE', name: 'arnaud', age: 43 },
        useQueryString: false,
        forceRefreshToken: false,
      },
      {
        index: 7,
        method: 'error',
        path: '/test',
        parameters: { methode: 'DELETE', name: 'arnaud', age: 43 },
        useQueryString: false,
        forceRefreshToken: false,
      },
    ]);

    const ref_selected_query = ref<QueryTest>(query_tests.value[0]);
    const testApi = async () => {
      try {
        error_message.value = null; // Reset error before fetch
        messageApi.value = await invokeApi(ref_selected_query.value);
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

    const testSocketApi = async () => {
      try {
        error_message.value = null; // Reset error before fetch
        messageSocketApi.value = await invokeSocketApi();
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
      messageApi,
      messageSocketApi,
      error_message,
      query_tests,
      ref_selected_query,
      testApi,
      testSocketApi,
    };
  },
});
</script>

<style scoped>
.text-negative {
  color: #f44336;
}
</style>
