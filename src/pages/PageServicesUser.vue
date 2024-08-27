<!-- src/pages/TestApiPage.vue -->

<template>
  <q-page padding>
    <q-card>
      <q-card-section>
        <div class="text-h6">Test API: User Groups</div>
      </q-card-section>

      <q-card-section>
        <q-btn
          label="Fetch User Groups"
          @click="fetchUserGroups"
          color="primary"
        />
      </q-card-section>

      <q-card-section v-if="error" class="text-negative">
        Error: {{ error }}
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
import { getUserGroups, QueryError } from '../services/ServicesUsers';

export default defineComponent({
  name: 'PageServicesUser',
  setup() {
    const groups = ref<string[]>([]);
    const error = ref<string | null>(null);

    const fetchUserGroups = async () => {
      try {
        error.value = null; // Reset error before fetch
        groups.value = await getUserGroups();
      } catch (err) {
        error.value =
          'Error fetching user groups: => ' +
          (err as QueryError).response?.data?.error;
      }
    };

    return {
      groups,
      error,
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
