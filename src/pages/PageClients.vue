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
          {{ props.row.subscription?.plan }}
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
      <q-card style="width: 90%; max-width: 1200px">
        <q-card-section>
          <div class="text-h6">{{ clientDialog.isEdit ? 'Modifier' : 'Ajouter' }} un client</div>
        </q-card-section>

        <div class="flex q-gutter-xl">
          <q-card-section style="flex: 1">
            <div class="text-bold q-mb-md">Informations</div>
            <div class="flex q-gutter-md">
              <q-input
                class="q-mb-md"
                style="flex: 1%"
                v-model="clientDialog.client.given_name"
                label="Prénom"
                outlined
                dense
              />
              <q-input
                class="q-mb-md"
                style="flex: 1%"
                v-model="clientDialog.client.family_name"
                label="Nom"
                outlined
                dense
              />
            </div>
            <q-input
              disable
              class="q-mb-md"
              v-model="clientDialog.client.email"
              label="Email"
              outlined
              dense
              type="email"
            />

            <!--<div class="q-pt-md">
              <div class="flex items-center q-gutter-sm">
                <div class="text-bold q-mb-md">Abonnement en cours</div>
              </div>
              <div class="q-mb-md text-grey-8 text-caption" v-if="!editedSubscription?.plan">
                Ce compte n'a pas d'abonnement en cours.
              </div>
              <div class="flex q-gutter-md">
                <q-toggle v-model="editedSubscription.active" />

                <q-select
                  style="flex: 1"
                  outlined
                  dense
                  v-model="editedSubscription.plan"
                  map-options
                  :options="['WATCH', 'SEARCH', 'GRAPH']"
                />

                <q-input
                  style="flex: 1; width: 100px"
                  v-model="editedSubscription.startDate"
                  label="Date de début"
                  outlined
                  dense
                  type="date"
                />

                <q-input
                  style="flex: 1; width: 100px"
                  v-model="editedSubscription.endDate"
                  label="Date de fin"
                  outlined
                  dense
                  type="date"
                />
              </div>
            </div>-->
            <q-card-actions align="right" class="flex q-gutter-md">
              <BaseButton v-close-popup secondary>Annuler</BaseButton>
              <BaseButton @click="saveClient">Enregistrer</BaseButton>
            </q-card-actions>
          </q-card-section>

          <q-card-section style="width: 350px">
            <div class="text-bold q-mb-md">Rôles ({{ clientDialog.user_groups.length }})</div>
            <!--<q-select
              outlined
              dense
              label="Rôles"
              v-model="clientDialog.user_groups"
              :options="clientDialog.groups_available"
              multiple
              map-options
              :option-label="(group) => group.GroupName + ' (' + group.Precedence + ')'"
              :option-value="(group) => group.GroupName"
              hint="Nombre du rôle (plus le nombre est élevé, plus le rôle est prioritaire)"
            />-->

            <q-scroll-area style="height: 250px">
              <q-list>
                <template v-for="group in clientDialog.user_groups" :key="group">
                  <q-item dense>
                    <q-item-section>
                      <q-item-label>
                        {{ group }} ({{
                          clientDialog.groups_available.find((g) => g.GroupName === group)
                            ?.Precedence
                        }})
                      </q-item-label>
                      <q-item-label caption lines="2">
                        {{
                          clientDialog.groups_available.find((g) => g.GroupName === group)
                            ?.Description
                        }}
                      </q-item-label>
                    </q-item-section>

                    <q-item-section side top>
                      <q-item-label caption>
                        {{
                          formatDate(
                            clientDialog.groups_available.find((g) => g.GroupName === group)
                              ?.LastModifiedDate || ''
                          )
                        }}
                      </q-item-label>

                      <q-icon name="close" class="cursor-pointer" @click="removeGroup(group)" />
                    </q-item-section>
                  </q-item>
                  <q-separator spaced inset />
                </template>

                <template
                  v-for="group in clientDialog.groups_available
                    .filter((g) => !clientDialog.user_groups.includes(g.GroupName))
                    .sort((a, b) => a.Precedence - b.Precedence)"
                  :key="group"
                >
                  <q-item dense>
                    <q-item-section>
                      <q-item-label> {{ group.GroupName }} ({{ group.Precedence }}) </q-item-label>
                      <q-item-label caption lines="2">
                        {{ group.Description }}
                      </q-item-label>
                    </q-item-section>

                    <q-item-section side top>
                      <q-item-label caption>
                        {{ formatDate(group.LastModifiedDate || '') }}
                      </q-item-label>

                      <q-icon
                        name="add"
                        class="cursor-pointer"
                        @click="addGroup(group.GroupName)"
                      />
                    </q-item-section>
                  </q-item>
                  <q-separator spaced inset />
                </template>
              </q-list>
            </q-scroll-area>
          </q-card-section>
        </div>
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

interface Client {
  id: number;
  given_name: string;
  family_name: string;
  email: string;
  phone: string;
  subscription: Subscription | null;
}

interface ClientDialog {
  show: boolean;
  isEdit: boolean;
  client: Client;
  user_groups: Group[];
  groups_available:
    | [
        {
          CreationDate: string;
          Description: string;
          GroupName: string;
          LastModifiedDate: string;
          Precedence: number;
          RoleArn: string;
          userPoolId: string;
        }
      ]
    | [];
}

interface DeleteDialog {
  show: boolean;
  client: Client | null;
}

type Group = string;

export default defineComponent({
  components: {
    BaseButton,
  },
  name: 'LegalmapPages',
  props: {},
  setup() {
    const search = ref('');
    const loading = ref(false);
    const clients = ref<Client[]>([]);
    const router = useRouter();

    const editedSubscription = ref<Subscription>({
      active: false,
      plan: '',
      price: 0,
      subscription: '',
      invoice: '',
      startDate: '',
      endDate: '',
    });

    const formatDate = computed(() => (date: string) => {
      return new Date(date).toLocaleDateString();
    });

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

        if (response && Array.isArray(response.users)) {
          clients.value = response.users;
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
      client: {
        id: 0,
        given_name: '',
        family_name: '',
        email: '',
        phone: '',
        subscription: editedSubscription.value,
      },
      user_groups: [],
      groups_available: [],
    });

    const deleteDialog = ref<DeleteDialog>({
      show: false,
      client: null,
    });

    const openAddClientDialog = () => {
      clientDialog.value = {
        show: true,
        isEdit: false,
        client: {
          id: 0,
          given_name: '',
          family_name: '',
          email: '',
          phone: '',
          subscription: editedSubscription.value,
        },
        user_groups: [],
        groups_available: [],
      };
    };

    const editClient = async (client: Client) => {
      const userRoles = await invokeApi({
        index: 1,
        method: 'GET',
        path: '/users/' + client.id + '/roles',
        parameters: '',
        useQueryString: false,
        forceRefreshToken: false,
      });

      editedSubscription.value = JSON.parse(JSON.stringify(client.subscription || {})) || {
        active: false,
        plan: '',
        price: 0,
        subscription: '',
        invoice: '',
        startDate: '',
        endDate: '',
      };

      editedSubscription.value.startDate = editedSubscription.value.startDate?.split(' ')[0];
      editedSubscription.value.endDate = editedSubscription.value.endDate?.split(' ')[0];

      clientDialog.value = {
        show: true,
        isEdit: true,
        client: { ...client, subscription: editedSubscription.value },
        user_groups: userRoles.user_groups,
        groups_available: userRoles.groups_available,
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
              given_name: clientDialog.value.client?.given_name,
              family_name: clientDialog.value.client?.family_name,
              email: clientDialog.value.client?.email,
              subscription: clientDialog.value.client?.subscription,
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
            path: '/users/' + clientDialog.value.client?.id,
            parameters: {
              given_name: clientDialog.value.client?.given_name,
              family_name: clientDialog.value.client?.family_name,
              subscription: clientDialog.value.client?.subscription,
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

    const addGroup = async (group: string) => {
      try {
        const response = await invokeApi({
          index: 1,
          method: 'POST',
          path: '/users/' + clientDialog.value.client.email + '/group/' + group,
          parameters: '',
          useQueryString: false,
          forceRefreshToken: false,
        });

        if (response) {
          clientDialog.value.user_groups.push(group);
        }

        console.log(response);
      } catch (error) {
        Notify.create({
          message: "Une erreur est survenue lors de l'ajout du rôle",
          color: 'negative',
        });
      }
    };

    const removeGroup = async (group: string) => {
      try {
        const response = await invokeApi({
          index: 1,
          method: 'DELETE',
          path: '/users/' + clientDialog.value.client.email + '/group/' + group,
          parameters: undefined,
          useQueryString: false,
          forceRefreshToken: false,
        });

        if (response) {
          clientDialog.value.user_groups = clientDialog.value.user_groups.filter(
            (g) => g !== group
          );
        }
      } catch (error) {
        Notify.create({
          message: 'Une erreur est survenue lors de la suppression du rôle',
          color: 'negative',
        });
      }
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
      formatDate,
      openAddClientDialog,
      editClient,
      saveClient,
      confirmDeleteClient,
      deleteClient,
      editedSubscription,
      addGroup,
      removeGroup,
    };
  },

  async mounted() {
    const authStore = useAuthStore();
    authStore.redirectIfNotLoggedIn();
  },
});
</script>
