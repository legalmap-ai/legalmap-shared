<template>
  <q-page padding>
    <h1 class="text-h4 q-mb-md">Les organisations</h1>

    <div class="flex q-gutter-md items-center">
      <SelectOrganization />
    </div>

    <div class="flex q-gutter-md q-mt-md">
      <q-input outlined v-model="organization_name" label="Nom" dense />
      <BaseButton @click="handleCreate">Créer une organisation</BaseButton>
    </div>

    <TableOrganizations />
  </q-page>
</template>

<script lang="ts">
import BaseButton from '../components/BaseButton.vue';
import { invokeApi } from '../services/ServicesUsers';
import { defineComponent, ref } from 'vue';
import SelectOrganization from '../components/SelectOrganization.vue';
import TableOrganizations from 'src/components/TableOrganizations.vue';

export default defineComponent({
  components: {
    BaseButton,
    SelectOrganization,
    TableOrganizations,
  },
  name: 'LegalmapOrganizations',
  props: {},
  setup() {
    const organization_name = ref('');

    const handleCreate = async () => {
      if (organization_name.value.length > 0) {
        const response = await invokeApi({
          index: 1,
          method: 'POST',
          path: '/organizations',
          parameters: {
            organization_name: organization_name.value,
          },
          useQueryString: false,
          forceRefreshToken: false,
        });

        console.log(response);
      } else {
        console.log('Please enter a name');
      }
    };

    return {
      organization_name,
      handleCreate,
    };
  },
});
</script>
