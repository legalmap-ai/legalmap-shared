<template>
  <div>
    <q-select
      dark
      style="width: 200px"
      v-model="selectedOrganization"
      :options="organizations"
      label="Changer d'organisation"
      map-options
      :option-label="(item) => item.organization_name"
      :option-value="(item) => item._id"
      dense
      outlined
      @update:model-value="handleOrganizationChange"
    />
  </div>
</template>

<script lang="ts">
import { invokeApi } from '../services/ServicesUsers';
import { defineComponent, onMounted, ref } from 'vue';

interface Organization {
  _id: string;
  organization_name: string;
  user_id: string;
}

export default defineComponent({
  name: 'LegalmapOrganizations',
  setup() {
    const selectedOrganization = ref(null);
    const organizations = ref<Organization[]>([]);

    onMounted(async () => {
      const account = await invokeApi({
        index: 1,
        method: 'GET',
        path: '/users/me',
        parameters: {},
        useQueryString: false,
        forceRefreshToken: false,
      });

      selectedOrganization.value = account.data.current_organization;

      const orgs = (await invokeApi({
        index: 1,
        method: 'GET',
        path: '/organizations/me',
        parameters: {},
        useQueryString: false,
        forceRefreshToken: false,
      })) as { organizations: Organization[]; statusCode: number; success: boolean };

      organizations.value = orgs.organizations.map((org: Organization) => ({
        _id: org._id,
        organization_name: org.organization_name,
        user_id: org.user_id,
      }));
    });

    const handleOrganizationChange = async (value: string) => {
      await invokeApi({
        index: 1,
        method: 'PUT',
        path: '/organizations/active',
        parameters: {
          current_organization: value,
        },
        useQueryString: false,
        forceRefreshToken: false,
      });

      window.location.reload();
    };

    return {
      organizations,
      selectedOrganization,
      handleOrganizationChange,
    };
  },
});
</script>
