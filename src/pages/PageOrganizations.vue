<template>
  <q-page padding>
    <h1 class="text-h4 q-mb-md">Les organisations</h1>

    <div class="flex q-gutter-md q-mt-md">
      <q-input outlined v-model="organization_name" label="Nom" dense />
      <BaseButton @click="handleCreate">Créer une organisation</BaseButton>
    </div>

    <TableOrganizations :key="refresh_key" />
  </q-page>
</template>

<script lang="ts">
import BaseButton from '../components/BaseButton.vue';
import { invokeApi } from '../services/ServicesUsers';
import { Ref, defineComponent, ref } from 'vue';
import TableOrganizations from 'src/components/TableOrganizations.vue';
import { Notify } from 'quasar';
export default defineComponent({
  components: {
    BaseButton,
    TableOrganizations,
  },
  name: 'LegalmapOrganizations',

  setup() {
    const organization_name = ref('');
    const refresh_key: Ref<number> = ref(0);

    const handleCreate = async () => {
      try {
        if (organization_name.value.length > 0) {
          await invokeApi({
            index: 1,
            method: 'POST',
            path: '/organizations',
            parameters: {
              organization_name: organization_name.value,
            },
            useQueryString: false,
            forceRefreshToken: false,
          });
        } else {
          console.log('Please enter a name');
        }
      } catch (error) {
        Notify.create({
          message: "Erreur lors de la création de l'organisation",
          color: 'negative',
          position: 'top',
        });
      } finally {
        refresh_key.value += 1;
      }
    };

    return {
      organization_name,
      handleCreate,
      refresh_key,
    };
  },
});
</script>
