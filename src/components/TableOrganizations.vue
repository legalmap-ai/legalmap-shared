<template>
  <q-page padding>
    <h1 class="text-h4 q-mb-md">Gestion des Organisations</h1>

    <div class="q-mb-md">
      <q-input v-model="search" filled type="search" label="Rechercher une organisation">
        <template v-slot:append>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <q-table
      :rows="filteredOrganizations"
      :columns="columns"
      row-key="_id"
      :filter="search"
      :loading="loading"
    >
      <template v-slot:top-right>
        <q-btn
          color="primary"
          icon="add"
          label="Nouvelle Organisation"
          @click="openAddorganizationDialog"
        />
      </template>

      <template v-slot:body-cell-subscription="props">
        <q-td :props="props">
          {{ props.row.subscription?.map((sub: Subscription) => sub.plan).join(', ') }}
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn flat round color="warning" icon="edit" @click="editOrganization(props.row)" />
          <q-btn
            flat
            round
            color="negative"
            icon="delete"
            @click="confirmDeleteOrganization(props.row)"
          />
        </q-td>
      </template>
    </q-table>

    <!-- Dialogue pour ajouter/éditer une organisation -->
    <q-dialog v-model="organizationDialog.show" persistent>
      <q-card style="width: 90%; max-width: 1200px">
        <q-card-section>
          <div class="text-h6">
            {{ organizationDialog.isEdit ? 'Modifier' : 'Ajouter' }} une organisation
          </div>
        </q-card-section>

        <div class="flex q-gutter-xl">
          <q-card-section style="flex: 1">
            <div class="text-bold q-mb-md">Informations</div>
            <q-input
              class="q-mb-md"
              v-model="organizationDialog.organization.organization_name"
              label="Nom de l'organisation"
              outlined
              dense
            />

            <div class="text-bold q-mb-sm">
              Membres de l'organisation ({{ organizationDialog.organization.members.length }}/{{
                getMaxSeats
              }})
            </div>
            <div class="">
              <q-chip
                v-for="(member, index) in organizationDialog.organization.members"
                :key="index"
                removable
                @remove="removeMember(member)"
              >
                {{ member.email }}
              </q-chip>
            </div>
            <div class="flex q-gutter-sm q-mt-md">
              <q-input v-model="newMember" label="Ajouter un membre" outlined dense />
              <q-btn @click="addMember" icon="add" />
            </div>
          </q-card-section>
        </div>

        <q-card-actions align="right" class="flex q-gutter-md">
          <BaseButton v-close-popup secondary>Annuler</BaseButton>
          <BaseButton @click="saveOrganization">Enregistrer</BaseButton>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialogue de confirmation de suppression -->
    <q-dialog v-model="deleteDialog.show" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="delete" color="negative" text-color="white" />
          <span class="q-ml-sm">Êtes-vous sûr de vouloir supprimer cette organisation ?</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Annuler" color="primary" v-close-popup />
          <q-btn flat label="Supprimer" color="negative" @click="deleteOrganization" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script lang="ts">
import { ref, computed, onMounted, defineComponent } from 'vue';
import { Notify, QTableColumn } from 'quasar';
import { invokeApi } from '../services/ServicesUsers';
import { useAuthStore } from '../stores/store-auth';
import { useRouter } from 'vue-router';
import BaseButton from '../components/BaseButton.vue';

interface Subscription {
  active: boolean;
  plan: string;
  price: number;
  subscription: string;
  invoice: string;
  startDate: string;
  endDate: string;
  seats?: number;
}

interface Member {
  email: string;
}

interface Organization {
  _id: string;
  user_id: string;
  organization_name: string;
  members: Member[];
  subscription: Subscription[];
}

interface OrganizationDialog {
  show: boolean;
  isEdit: boolean;
  organization: Organization;
}

interface DeleteDialog {
  show: boolean;
  organization: Organization | null;
}

export default defineComponent({
  components: {
    BaseButton,
  },
  name: 'LegalmapPages',
  setup() {
    const search = ref('');
    const loading = ref(false);
    const organizations = ref<Organization[]>([]);
    const router = useRouter();
    const editedSubscription = ref<Subscription[]>([]);

    const getMaxSeats = computed(() => {
      return editedSubscription.value.reduce((acc, sub) => acc + (sub.seats || 0), 0);
    });

    const filteredOrganizations = computed(() => {
      return organizations.value.filter((organization) =>
        organization.organization_name.toLowerCase().includes(search.value.toLowerCase())
      );
    });

    const organizationDialog = ref<OrganizationDialog>({
      show: false,
      isEdit: false,
      organization: {
        _id: '',
        user_id: '',
        organization_name: '',
        members: [],
        subscription: [],
      },
    });

    const deleteDialog = ref<DeleteDialog>({
      show: false,
      organization: null,
    });

    const fetchOrganizations = async () => {
      loading.value = true;
      try {
        const response = await invokeApi({
          index: 1,
          method: 'GET',
          path: '/organizations',
        });
        organizations.value = response.organizations || [];
      } catch (error) {
        Notify.create({
          message: 'Erreur lors de la récupération des organisations',
          color: 'negative',
        });
      } finally {
        loading.value = false;
      }
    };

    const openAddorganizationDialog = () => {
      organizationDialog.value.show = true;
      organizationDialog.value.isEdit = false;
    };

    const editOrganization = (organization: Organization) => {
      editedSubscription.value = organization.subscription;
      organizationDialog.value = {
        show: true,
        isEdit: true,
        organization: JSON.parse(JSON.stringify(organization)),
      };
    };

    const saveOrganization = async () => {
      try {
        const { organization } = organizationDialog.value;
        await invokeApi({
          index: 1,
          method: organization._id ? 'PUT' : 'POST',
          path: `/organizations/${organization._id || ''}`,
          parameters: organization,
        });
        await fetchOrganizations();
        organizationDialog.value.show = false;
      } catch (error) {
        Notify.create({
          message: "Erreur lors de l'enregistrement",
          color: 'negative',
        });
      }
    };

    const confirmDeleteOrganization = (organization: Organization) => {
      deleteDialog.value.organization = organization;
      deleteDialog.value.show = true;
    };

    const deleteOrganization = async () => {
      try {
        if (deleteDialog.value.organization) {
          await invokeApi({
            index: 1,
            method: 'DELETE',
            path: `/organizations/${deleteDialog.value.organization._id}`,
          });
          await fetchOrganizations();
          deleteDialog.value.show = false;
        }
      } catch (error) {
        Notify.create({
          message: 'Erreur lors de la suppression',
          color: 'negative',
        });
      }
    };

    const newMember = ref('');

    const addMember = () => {
      if (organizationDialog.value.organization.members.length >= getMaxSeats.value) {
        Notify.create({
          message: 'Vous avez atteint le nombre maximum de membres pour cette organisation',
          color: 'negative',
        });
        return;
      }
      organizationDialog.value.organization.members.push({ email: newMember.value });
      newMember.value = '';
    };

    const removeMember = (member: Member) => {
      organizationDialog.value.organization.members =
        organizationDialog.value.organization.members.filter((m) => m !== member);
    };

    onMounted(fetchOrganizations);

    return {
      search,
      loading,
      organizations,
      filteredOrganizations,
      organizationDialog,
      deleteDialog,
      editedSubscription,
      openAddorganizationDialog,
      editOrganization,
      saveOrganization,
      confirmDeleteOrganization,
      deleteOrganization,
      newMember,
      addMember,
      removeMember,
      getMaxSeats,
    };
  },

  async mounted() {
    const authStore = useAuthStore();
    authStore.redirectIfNotLoggedIn();
  },
});
</script>
