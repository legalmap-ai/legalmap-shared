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
      row-key="id"
      :filter="search"
      :loading="loading"
    >
      <template v-slot:top-right>
        <!--<q-btn
          color="primary"
          icon="add"
          label="Nouveau Organization"
          @click="openAddorganizationDialog"
        />-->
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

    <!-- Dialogue pour ajouter/éditer un organisation -->
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
            <div class="flex q-gutter-md">
              <q-input
                class="q-mb-md"
                style="flex: 1%"
                v-model="organizationDialog.organization.organization_name"
                label="Prénom"
                outlined
                dense
              />
            </div>
            <div class="text-bold q-mb-sm">
              Membres de l'organisation ({{ organizationDialog.organization.members.length }}/{{
                getMaxSeats
              }})
            </div>
            <div class="">
              <div>
                <q-chip
                  v-for="member in organizationDialog.organization.members"
                  :key="member"
                  removable
                  @remove="removeMember(member)"
                >
                  {{ member }}
                </q-chip>
              </div>
              <div class="flex q-gutter-sm q-mt-md">
                <q-input v-model="newMember" label="Ajouter un membre" outlined dense />
                <q-btn @click="addMember" icon="add" />
              </div>
            </div>

            <div class="q-pt-md">
              <div class="flex items-center q-gutter-sm">
                <div class="text-bold q-mb-md">Abonnement en cours</div>
              </div>
              <div class="q-mb-md text-grey-8 text-caption" v-if="editedSubscription?.length === 0">
                Ce compte n'a pas d'abonnement en cours.
              </div>
              <div
                class="flex q-gutter-md q-mb-md"
                v-for="(sub, index) in editedSubscription"
                :key="index"
              >
                <q-toggle v-model="sub.active" />

                <q-select
                  style="flex: 1"
                  outlined
                  dense
                  v-model="sub.plan"
                  map-options
                  :options="['WATCH', 'SEARCH', 'GRAPH']"
                />

                <q-input
                  style="flex: 1; width: 100px"
                  v-model="sub.startDate"
                  label="Date de début"
                  outlined
                  dense
                  type="date"
                />

                <q-input
                  style="flex: 1; width: 100px"
                  v-model="sub.endDate"
                  label="Date de fin"
                  outlined
                  dense
                  type="date"
                />

                <q-input
                  style="flex: 1; width: 100px"
                  v-model="sub.seats"
                  label="Nombre de sièges"
                  outlined
                  dense
                  type="number"
                />

                <q-btn flat icon="delete" @click="editedSubscription.splice(index, 1)" />
              </div>
            </div>
            <q-btn
              @click="
                editedSubscription.push({
                  active: false,
                  plan: '',
                  price: 0,
                  subscription: '',
                  invoice: '',
                  startDate: '',
                  endDate: '',
                })
              "
              label="Ajouter un abonnement"
              color="primary"
              class="q-mt-md"
            />
            <q-card-actions align="right" class="flex q-gutter-md">
              <BaseButton v-close-popup secondary>Annuler</BaseButton>
              <BaseButton @click="saveOrganization">Enregistrer</BaseButton>
            </q-card-actions>
          </q-card-section>
        </div>
      </q-card>
    </q-dialog>

    <!-- Dialogue de confirmation de suppression -->
    <q-dialog v-model="deleteDialog.show" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="delete" color="negative" text-color="white" />
          <span class="q-ml-sm">Êtes-vous sûr de vouloir supprimer cette organization ?</span>
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
}

interface email {
  email: string;
}

interface Organization {
  _id: string;
  user_id: string;
  organization_name: string;
  members: email[];
  subscription: Subscription[] | null;
}

interface organizationDialog {
  show: boolean;
  isEdit: boolean;
  organization: Organization[];
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

    const editedSubscription = ref<Subscription[]>([
      {
        active: false,
        plan: '',
        price: 0,
        subscription: '',
        invoice: '',
        startDate: '',
        endDate: '',
      },
    ]);

    const formatDate = computed(() => (date: string) => {
      return new Date(date).toLocaleDateString();
    });

    const getMaxSeats = computed(() => {
      console.log(organizationDialog.value.organization);
      const seats = organizationDialog.value.organization.subscription.reduce(
        (acc, sub) => acc + sub.seats,
        0
      );

      return parseInt(seats);
    });

    const fetchOrganizations = async () => {
      loading.value = true;
      try {
        const response = await invokeApi({
          index: 1,
          method: 'GET',
          path: '/organizations',
          parameters: '',
          useQueryString: true,
          forceRefreshToken: false,
        });

        if (response && Array.isArray(response.organizations)) {
          organizations.value = response.organizations;
        } else {
          console.error('Invalid response format:', response);
        }
      } catch (error) {
        router.push('/');
        Notify.create({
          message: "Vous n'avez pas les droits pour accéder à cette page",
          color: 'negative',
        });
      } finally {
        loading.value = false;
      }
    };

    const columns: QTableColumn[] = [
      {
        name: 'organization_name',
        required: true,
        label: 'Nom',
        align: 'left',
        field: 'organization_name',
        sortable: true,
      },
      {
        name: 'subscription',
        align: 'left',
        label: 'Statut Abonnement',
        field: 'subscription',
        sortable: true,
      },
      { name: 'actions', align: 'center', label: 'Actions', field: 'actions' },
    ];

    const filteredOrganizations = computed(() => {
      return organizations.value.filter((organization) =>
        organization.organization_name?.toLowerCase().includes(search.value.toLowerCase())
      );
    });

    const organizationDialog = ref<organizationDialog>({
      show: false,
      isEdit: false,
      organization: [
        {
          _id: '',
          user_id: '',
          organization_name: '',
          members: [],
          subscription: editedSubscription.value,
        },
      ],
    });

    const deleteDialog = ref<DeleteDialog>({
      show: false,
      organization: null,
    });

    const openAddorganizationDialog = () => {
      organizationDialog.value = {
        show: true,
        isEdit: false,
        organization: {
          _id: '',
          user_id: '',
          organization_name: '',
          members: [],
          subscription: editedSubscription.value,
        },
        user_groups: [],
        groups_available: [],
      };
    };

    const editOrganization = async (organization: Organization) => {
      editedSubscription.value = JSON.parse(JSON.stringify(organization.subscription || [])) || [
        {
          active: false,
          plan: '',
          price: 0,
          subscription: '',
          invoice: '',
          startDate: '',
          endDate: '',
        },
      ];

      for (const sub of editedSubscription.value) {
        sub.startDate = sub.startDate?.split(' ')[0];
        sub.endDate = sub.endDate?.split(' ')[0];
      }

      if (!organization.members) {
        organization.members = [];
      }

      organizationDialog.value = {
        show: true,
        isEdit: true,
        organization: { ...organization, subscription: editedSubscription.value },
      };
    };

    const saveOrganization = async () => {
      try {
        await invokeApi({
          index: 1,
          method: 'PUT',
          path: '/organizations/' + organizationDialog.value.organization?._id,
          parameters: {
            organization_name: organizationDialog.value.organization?.organization_name,
            subscription: organizationDialog.value.organization?.subscription,
            members: organizationDialog.value.organization?.members,
          },
          useQueryString: false,
          forceRefreshToken: false,
        });
      } catch (error) {
        Notify.create({
          message: 'Une erreur est survenue lors de la modification du organization',
          color: 'negative',
        });
      }
      await fetchOrganizations();
      organizationDialog.value.show = false;
    };

    const confirmDeleteOrganization = (organization: Organization) => {
      deleteDialog.value = {
        show: true,
        organization: organization,
      };
    };

    const deleteOrganization = async () => {
      if (deleteDialog.value.organization) {
        await invokeApi({
          index: 1,
          method: 'DELETE',
          path: '/organizations/' + deleteDialog.value.organization._id,
          parameters: undefined,
          useQueryString: false,
          forceRefreshToken: false,
        });
      }
      deleteDialog.value.show = false;

      await fetchOrganizations();
    };

    const removeMember = (member: email) => {
      organizationDialog.value.organization.members =
        organizationDialog.value.organization.members.filter((m: email) => m !== member);
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

      organizationDialog.value.organization.members.push(newMember.value);
      newMember.value = '';
    };

    onMounted(fetchOrganizations);

    return {
      search,
      loading,
      organizations,
      columns,
      filteredOrganizations,
      organizationDialog,
      deleteDialog,
      formatDate,
      getMaxSeats,
      openAddorganizationDialog,
      editOrganization,
      saveOrganization,
      confirmDeleteOrganization,
      deleteOrganization,
      editedSubscription,
      removeMember,
      newMember,
      addMember,
    };
  },

  async mounted() {
    const authStore = useAuthStore();
    authStore.redirectIfNotLoggedIn();
  },
});
</script>
