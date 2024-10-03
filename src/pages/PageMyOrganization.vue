<template>
  <q-page padding>
    <h1 class="text-h4 q-mb-md">Mes Organisations</h1>

    <!-- Vérification si les organisations existent -->
    <div v-if="organization">
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <q-input
            v-model="organization.organization_name"
            label="Nom de l'organisation"
            dense
            outlined
          />

          <div v-if="organization.members">
            <p class="q-mt-md q-mb-none">
              Membres ({{ organization.members.length }}/{{ getMaxMembers }}) :
            </p>
            <div class="q-mb-sm">
              <q-chip
                v-for="member in organization.members"
                :key="member"
                @remove="
                  () => {
                    handleRemoveMember(member);
                  }
                "
                removable
              >
                {{ member }}
              </q-chip>
            </div>
            <div class="flex">
              <q-input v-model="newMember" label="Ajouter un email" dense outlined type="email" />
              <q-btn class="q-ml-md" color="primary" icon="add" @click="handleAddMember" />
            </div>
          </div>

          <q-btn class="q-mt-lg" color="primary" label="Enregistrer" @click="handleSave" />
        </q-card-section>

        <!-- Abonnements de l'organisation -->
        <q-card-section v-if="organization.subscription">
          <h3 class="text-h6 q-mb-md">Détails des Abonnements</h3>
          <q-table :rows="organization.subscription" :columns="columns" row-key="_id" />
        </q-card-section>
        <q-card v-else class="q-mt-md" flat bordered>
          <q-card-section>
            <q-banner dense> Aucun abonnement en cours. </q-banner>
          </q-card-section>
        </q-card>
      </q-card>
    </div>

    <!-- Message si aucune organisation n'est trouvée -->
    <div v-else>
      <q-banner class="q-mt-md" dense> Aucune organisation active trouvée. </q-banner>
    </div>
  </q-page>
</template>

<script lang="ts">
import { Notify } from 'quasar';
import { invokeApi } from 'src/services/ServicesUsers';
import { defineComponent, onMounted } from 'vue';
import { ref } from 'vue';

type email = string;

interface Subscription {
  active: boolean;
  startDate: string;
  endDate: string;
  invoice: string;
  plan: string;
  price: number;
  seats: string;
  subscription: string;
}

interface Organzation {
  _id: string;
  organization_name: string;
  members: email[];
  subscription: Subscription[];
}

export default defineComponent({
  name: 'LegalmapMyOrganizations',
  setup() {
    const organization = ref<Organzation | null>(null);
    const columns = ref([
      { name: 'plan', label: 'Plan', align: 'left', field: 'plan' },
      {
        name: 'price',
        label: 'Prix',
        align: 'right',
        field: 'price',
        format: (val: number) => `${(val / 100).toFixed(2)}€`,
      },
      { name: 'seats', label: 'Places', align: 'right', field: 'seats' },
      { name: 'startDate', label: 'Début', align: 'center', field: 'startDate' },
      { name: 'endDate', label: 'Fin', align: 'center', field: 'endDate' },
      {
        name: 'active',
        label: 'Actif',
        align: 'center',
        field: 'active',
        format: (val) => (val ? 'Oui' : 'Non'),
      },
    ]);

    const handleAddMember = () => {
      if (!newMember.value.includes('@')) {
        return Notify.create({
          message: 'Veuillez entrer un email valide',
          position: 'top',
          color: 'negative',
        });
      }

      if (organization.value?.members.includes(newMember.value)) {
        return Notify.create({
          message: "Cet email est déjà membre de l'organisation",
          position: 'top',
          color: 'negative',
        });
      }

      if (organization.value?.members.length >= getMaxMembers.value) {
        return Notify.create({
          message: 'Nombre maximum de membres atteint',
          position: 'top',
          color: 'negative',
        });
      }

      if (organization.value) {
        organization.value.members.push(newMember.value);
      }
    };

    const handleRemoveMember = (member: email) => {
      if (organization.value) {
        organization.value.members = organization.value.members.filter((m) => m !== member);
      }
    };

    const newMember = ref<email>('');
    const getMaxMembers = ref(0);

    const handleSave = () => {
      if (organization.value) {
        invokeApi({
          index: 1,
          method: 'PUT',
          path: '/organizations/' + organization.value._id,
          parameters: {
            organization_name: organization.value.organization_name || '',
            members: organization.value.members || [],
            subscription: organization.value.subscription || [],
          },
          useQueryString: false,
          forceRefreshToken: false,
        });
      }
    };

    onMounted(async () => {
      organization.value = (
        await invokeApi({
          index: 1,
          method: 'GET',
          path: '/organizations/active',
          parameters: {},
          useQueryString: false,
          forceRefreshToken: false,
        })
      ).organization;

      if (!organization.value) {
        return;
      }

      getMaxMembers.value =
        organization.value?.subscription.reduce((acc, sub) => acc + parseInt(sub.seats), 0) || 0;
    });

    return {
      organization,
      columns,
      handleAddMember,
      handleRemoveMember,
      newMember,
      getMaxMembers,
      handleSave,
    };
  },
});
</script>
