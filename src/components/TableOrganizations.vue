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
      <template v-slot:body-cell-subscriptions="props">
        <q-td :props="props">
          {{ props.row.subscriptions?.map((sub: Subscription) => sub.plan).join(', ') }}
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

    <!-- Dialogue pour éditer une organisation -->
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
                style="flex: 1"
                v-model="organizationDialog.organization.organization_name"
                label="Nom"
                outlined
                dense
              />
            </div>
            <div class="text-bold q-mb-sm" v-if="organizationDialog.organization.members">
              Membres de l'organisation ({{ organizationDialog.organization.members.length }})
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
                <q-input
                  v-model="newMember"
                  label="Ajouter un membre"
                  outlined
                  dense
                  @keyup.enter="addMember"
                />
                <q-btn @click="addMember" icon="add" />
              </div>
            </div>

            <div class="q-pt-md">
              <div class="flex items-center q-gutter-sm">
                <div class="text-bold q-mb-md">Abonnements en cours</div>
              </div>
              <div class="q-mb-md text-grey-8 text-caption" v-if="!editedSubscription.length">
                Ce compte n'a pas d'abonnement en cours.
              </div>
              <div class="q-mb-md" v-for="(sub, index) in editedSubscription" :key="index">
                <div class="flex q-gutter-md q-mb-md">
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
                    v-model.number="sub.seats"
                    label="Nombre de sièges"
                    outlined
                    dense
                    type="number"
                  />

                  <q-btn flat icon="delete" @click="handleDeleteSubscription(index)" />
                </div>

                <div>
                  <q-select
                    label="Sélectionner des membres"
                    v-model="sub.members"
                    multiple
                    :options="organizationDialog.organization.members"
                    outlined
                    dense
                  />
                </div>
              </div>
            </div>
            <q-btn
              @click="addSubscription"
              label="Ajouter un abonnement"
              icon="add"
              dense
              outline
              rounded
              no-caps
              color="primary"
              class="q-mt-md q-pr-sm"
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
import { Dialog, Notify, QTableColumn } from 'quasar';
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
  members: string[];
  seats: number;
}

interface Organization {
  _id: string;
  user_id: string;
  organization_name: string;
  members: string[];
  subscriptions: Subscription[] | null;
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

    const editedSubscription = ref<Subscription[]>([
      {
        active: false,
        plan: '',
        price: 0,
        subscription: '',
        invoice: '',
        startDate: '',
        endDate: '',
        members: [],
        seats: 0,
      },
    ]);

    const formatDate = computed(() => (date: string) => {
      return new Date(date).toLocaleDateString();
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
        name: 'subscriptions',
        align: 'left',
        label: 'Statut Abonnements',
        field: 'subscriptions',
        sortable: true,
      },
      { name: 'actions', align: 'center', label: 'Actions', field: 'actions' },
    ];

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
        subscriptions: null,
      },
    });

    const deleteDialog = ref<DeleteDialog>({
      show: false,
      organization: null,
    });

    const openAddOrganizationDialog = () => {
      organizationDialog.value = {
        show: true,
        isEdit: false,
        organization: {
          _id: '',
          user_id: '',
          organization_name: '',
          members: [],
          subscriptions: [], // Initialise avec un tableau vide
        },
      };
      editedSubscription.value = []; // Réinitialise les abonnements
    };

    const editOrganization = async (organization: Organization) => {
      editedSubscription.value = organization.subscriptions
        ? [...organization.subscriptions]
        : [
            {
              active: false,
              plan: '',
              price: 0,
              subscription: '',
              invoice: '',
              startDate: '',
              endDate: '',
              members: [],
              seats: 0,
            },
          ];

      // Formate les dates
      editedSubscription.value.forEach((sub) => {
        sub.startDate = sub.startDate.split('T')[0];
        sub.startDate = sub.startDate.split(' ')[0];
        sub.endDate = sub.endDate.split('T')[0];
        sub.endDate = sub.endDate.split(' ')[0];
      });

      organizationDialog.value = {
        show: true,
        isEdit: true,
        organization: { ...organization, subscriptions: editedSubscription.value },
      };
    };

    const saveOrganization = async () => {
      try {
        // check if the organization has a name
        if (organizationDialog.value.organization.organization_name.trim() === '') {
          Notify.create({
            message: "Le nom de l'organisation ne peut pas être vide",
            color: 'warning',
          });
          return;
        }

        for (let i = 0; i < editedSubscription.value.length; i++) {
          if (
            editedSubscription.value[i].plan.trim() === '' ||
            editedSubscription.value[i].startDate.trim() === '' ||
            editedSubscription.value[i].endDate.trim() === '' ||
            editedSubscription.value[i].seats === 0
          ) {
            Notify.create({
              message: "Veuillez remplir tous les champs de l'abonnement",
              color: 'warning',
            });
            return;
          }

          if (
            new Date(editedSubscription.value[i].startDate) >
            new Date(editedSubscription.value[i].endDate)
          ) {
            Notify.create({
              message: 'La date de début doit être avant la date de fin',
              color: 'warning',
            });
            return;
          }

          if (editedSubscription.value[i].members.length > editedSubscription.value[i].seats) {
            Notify.create({
              message: 'Le nombre de membres ne peut pas être supérieur au nombre de sièges',
              color: 'warning',
            });
            return;
          }

          if (editedSubscription.value[i].members.length !== editedSubscription.value[i].seats) {
            Notify.create({
              message: 'Le nombre de membres doit être égal au nombre de sièges',
              color: 'warning',
            });
            return;
          }
        }

        if (organizationDialog.value.isEdit) {
          await invokeApi({
            index: 1,
            method: 'PUT',
            path: '/organizations/' + organizationDialog.value.organization._id,
            parameters: {
              organization_name: organizationDialog.value.organization.organization_name,
              subscriptions: editedSubscription.value,
              members: organizationDialog.value.organization.members,
            },
            useQueryString: false,
            forceRefreshToken: false,
          });
          Notify.create({
            message: 'Organisation mise à jour avec succès',
            color: 'positive',
          });
        } else {
          await invokeApi({
            index: 1,
            method: 'POST',
            path: '/organizations',
            parameters: {
              organization_name: organizationDialog.value.organization.organization_name,
              subscriptions: editedSubscription.value,
              members: organizationDialog.value.organization.members,
            },
            useQueryString: false,
            forceRefreshToken: false,
          });
          Notify.create({
            message: 'Organisation ajoutée avec succès',
            color: 'positive',
          });
        }
      } catch (error) {
        Notify.create({
          message: "Une erreur est survenue lors de la sauvegarde de l'organisation",
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
        try {
          await invokeApi({
            index: 1,
            method: 'DELETE',
            path: '/organizations/' + deleteDialog.value.organization._id,
            parameters: undefined,
            useQueryString: false,
            forceRefreshToken: false,
          });
          Notify.create({
            message: 'Organisation supprimée avec succès',
            color: 'positive',
          });
        } catch (error) {
          Notify.create({
            message: "Une erreur est survenue lors de la suppression de l'organisation",
            color: 'negative',
          });
        }
      }
      deleteDialog.value.show = false;

      await fetchOrganizations();
    };

    const removeMember = (member: string) => {
      // Changé le type de string
      organizationDialog.value.organization.members =
        organizationDialog.value.organization.members.filter((m: string) => m !== member);

      // check if the member is in the subscription
      editedSubscription.value.forEach((sub) => {
        sub.members = sub.members.filter((m: string) => m !== member);
      });
    };

    const newMember = ref('');

    const addMember = () => {
      if (!organizationDialog.value.organization.members) {
        organizationDialog.value.organization.members = [];
      }

      if (newMember.value.trim() === '') {
        Notify.create({
          message: 'Le nom du membre ne peut pas être vide',
          color: 'warning',
        });
        return;
      }

      if (organizationDialog.value.organization.members.includes(newMember.value.trim())) {
        Notify.create({
          message: 'Ce membre est déjà dans la liste',
          color: 'warning',
        });
        return;
      }

      organizationDialog.value.organization.members.push(newMember.value.trim());
      newMember.value = '';
    };

    const handleDeleteSubscription = (index: number) => {
      Dialog.create({
        title: "Supprimer l'abonnement",
        message: 'Êtes-vous sûr de vouloir supprimer cet abonnement ?',
        ok: {
          label: 'Oui',
          color: 'negative',
        },
        cancel: {
          label: 'Non',
          color: 'primary',
        },
      }).onOk(() => {
        editedSubscription.value.splice(index, 1);
      });
    };

    const addSubscription = () => {
      editedSubscription.value.push({
        active: false,
        plan: '',
        price: 0,
        subscription: '',
        invoice: '',
        startDate: '',
        endDate: '',
        members: [],
        seats: 0,
      });
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
      openAddOrganizationDialog,
      editOrganization,
      saveOrganization,
      confirmDeleteOrganization,
      deleteOrganization,
      editedSubscription,
      removeMember,
      newMember,
      addMember,
      addSubscription,
      handleDeleteSubscription,
    };
  },

  mounted() {
    const authStore = useAuthStore();
    authStore.redirectIfNotLoggedIn();
  },
});
</script>
