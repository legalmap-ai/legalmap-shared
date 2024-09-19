<template>
  <q-page padding>
    <h1 class="text-h4 q-mb-md">Gestion des Clients</h1>

    <div class="q-mb-md">
      <q-input v-model="search" filled type="search" label="Rechercher un client">
        <template v-slot:append>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <q-table
      :rows="filteredClients"
      :columns="columns"
      row-key="id"
      :filter="search"
      :loading="loading"
    >
      <template v-slot:top-right>
        <q-btn color="primary" icon="add" label="Nouveau Client" @click="openAddClientDialog" />
      </template>

      <template v-slot:body-cell-subscription="props">
        <q-td :props="props">
          {{ props.row.subscription?.name }}
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn flat round color="warning" icon="edit" @click="editClient(props.row)" />
          <q-btn
            flat
            round
            color="negative"
            icon="delete"
            @click="confirmDeleteClient(props.row)"
          />
        </q-td>
      </template>
    </q-table>

    <!-- Dialogue pour ajouter/éditer un client -->
    <q-dialog v-model="clientDialog.show" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">{{ clientDialog.isEdit ? 'Modifier' : 'Ajouter' }} un client</div>
        </q-card-section>

        <q-card-section>
          <q-input v-model="clientDialog.form.given_name" label="Prénom" filled />
          <q-input v-model="clientDialog.form.family_name" label="Nom" filled />
          <q-input v-model="clientDialog.form.email" label="Email" filled type="email" />
          <q-input v-model="clientDialog.form.phone" label="Téléphone" filled />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Annuler" color="primary" v-close-popup />
          <q-btn flat label="Sauvegarder" color="primary" @click="saveClient" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialogue de confirmation de suppression -->
    <q-dialog v-model="deleteDialog.show" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="delete" color="negative" text-color="white" />
          <span class="q-ml-sm">Êtes-vous sûr de vouloir supprimer ce client ?</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Annuler" color="primary" v-close-popup />
          <q-btn flat label="Supprimer" color="negative" @click="deleteClient" />
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
// import { useRouter } from 'vue-router';

interface Client {
  id: number;
  given_name: string;
  family_name: string;
  email: string;
  phone: string;
  subscriptionStatus: string;
}

interface ClientDialog {
  show: boolean;
  isEdit: boolean;
  form: {
    id: number | null;
    given_name: string;
    family_name: string;
    email: string;
    phone: string;
  };
}

interface DeleteDialog {
  show: boolean;
  client: Client | null;
}

export default defineComponent({
  components: {},
  name: 'LegalmapPages',
  props: {},
  setup() {
    const search = ref('');
    const loading = ref(false);
    const clients = ref<Client[]>([]);
    // const router = useRouter();

    const fetchClients = async () => {
      loading.value = true;
      try {
        const response = await invokeApi({
          index: 1,
          method: 'GET',
          path: '/users',
          parameters: '',
          useQueryString: true,
          forceRefreshToken: false,
        });

        Notify.create({
          message: 'Succes !',
          color: 'positive',
        });
        console.log(response);
        // if (response && Array.isArray(response.users)) {
        //   clients.value = response.users;
        // } else {
        //   console.error('Invalid response format:', response);
        // }
      } catch (error) {
        //router.push('/');
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
        name: 'given_name',
        required: true,
        label: 'Prénom',
        align: 'left',
        field: 'given_name',
        sortable: true,
      },
      {
        name: 'family_name',
        required: true,
        label: 'Nom',
        align: 'left',
        field: 'family_name',
        sortable: true,
      },
      { name: 'email', align: 'left', label: 'Email', field: 'email', sortable: true },
      {
        name: 'subscription',
        align: 'left',
        label: 'Statut Abonnement',
        field: 'subscription',
        sortable: true,
      },
      { name: 'actions', align: 'center', label: 'Actions', field: 'actions' },
    ];

    const filteredClients = computed(() => {
      return clients.value.filter(
        (client) =>
          client.given_name?.toLowerCase().includes(search.value.toLowerCase()) ||
          client.family_name?.toLowerCase().includes(search.value.toLowerCase()) ||
          client.email?.toLowerCase().includes(search.value.toLowerCase())
      );
    });

    const clientDialog = ref<ClientDialog>({
      show: false,
      isEdit: false,
      form: {
        id: null,
        given_name: '',
        family_name: '',
        email: '',
        phone: '',
      },
    });

    const deleteDialog = ref<DeleteDialog>({
      show: false,
      client: null,
    });

    const openAddClientDialog = () => {
      clientDialog.value = {
        show: true,
        isEdit: false,
        form: { id: null, given_name: '', family_name: '', email: '', phone: '' },
      };
    };

    const editClient = (client: Client) => {
      clientDialog.value = {
        show: true,
        isEdit: true,
        form: { ...client },
      };
    };

    const saveClient = async () => {
      // if create
      if (!clientDialog.value.isEdit) {
        try {
          await invokeApi({
            index: 1,
            method: 'POST',
            path: '/clients/create',
            parameters: {
              given_name: clientDialog.value.form.given_name,
              family_name: clientDialog.value.form.family_name,
              email: clientDialog.value.form.email,
              phone: clientDialog.value.form.phone,
            },
            useQueryString: false,
            forceRefreshToken: false,
          });
        } catch (error) {
          Notify.create({
            message: 'Une erreur est survenue lors de la création du client',
            color: 'negative',
          });
        }
      } else {
        // if edit
        try {
          await invokeApi({
            index: 1,
            method: 'PUT',
            path: '/users',
            parameters: {
              id: clientDialog.value.form.id,
              given_name: clientDialog.value.form.given_name,
              family_name: clientDialog.value.form.family_name,
              email: clientDialog.value.form.email,
              phone: clientDialog.value.form.phone,
            },
            useQueryString: false,
            forceRefreshToken: false,
          });
        } catch (error) {
          Notify.create({
            message: 'Une erreur est survenue lors de la modification du client',
            color: 'negative',
          });
        }
      }

      await fetchClients();
      clientDialog.value.show = false;
    };

    const confirmDeleteClient = (client: Client) => {
      deleteDialog.value = {
        show: true,
        client: client,
      };
    };

    const deleteClient = async () => {
      if (deleteDialog.value.client) {
        await invokeApi({
          index: 1,
          method: 'DELETE',
          path: '/users/' + deleteDialog.value.client.id,
          parameters: undefined,
          useQueryString: false,
          forceRefreshToken: false,
        });
      }
      deleteDialog.value.show = false;

      await fetchClients();
    };

    onMounted(fetchClients);

    return {
      search,
      loading,
      clients,
      columns,
      filteredClients,
      clientDialog,
      deleteDialog,
      openAddClientDialog,
      editClient,
      saveClient,
      confirmDeleteClient,
      deleteClient,
    };
  },

  async mounted() {
    const authStore = useAuthStore();
    authStore.redirectIfNotLoggedIn();
  },
});
</script>
