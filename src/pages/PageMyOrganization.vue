<template>
  <q-page padding>
    <h1 class="text-h4 q-mb-md">Mes Organisations</h1>

    <!-- Indicateur de chargement initial -->
    <div v-if="isLoading" class="flex justify-center q-mt-md">
      <q-spinner color="primary" />
    </div>

    <!-- Vérification si les organisations existent -->
    <div v-else-if="organization">
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <q-input
            v-model="organization.organization_name"
            label="Nom de l'organisation"
            dense
            outlined
            :rules="[(val) => !!val || 'Le nom est requis']"
            class="q-mb-md"
          />

          <div v-if="organization.members">
            <p class="q-mt-md q-mb-none">
              Membres ({{ organization.members.length }}/{{ getMaxMembers }}) :
            </p>
            <div class="q-mb-sm">
              <q-chip
                v-for="member in organization.members"
                :key="member"
                @remove="handleRemoveMember(member)"
                removable
                color="secondary"
                text-color="white"
              >
                {{ member }}
              </q-chip>
            </div>
            <div class="flex q-gutter-sm q-mt-md">
              <q-input
                v-model="newMember"
                label="Ajouter un email"
                dense
                outlined
                type="email"
                :rules="[
                  (val) => !!val || 'L\'email est requis',
                  (val) => isValidEmail(val) || 'Entrez un email valide',
                ]"
              />
              <q-btn
                color="primary"
                icon="add"
                label="Ajouter"
                @click="handleAddMember"
                :disabled="isSaving"
              />
            </div>
          </div>

          <q-btn
            class="q-mt-lg"
            color="primary"
            label="Enregistrer"
            @click="handleSave"
            :loading="isSaving"
            :disabled="isSaving"
          />
        </q-card-section>

        <!-- Abonnements de l'organisation -->
        <q-card-section v-if="organization.subscription && organization.subscription.length">
          <h3 class="text-h6 q-mb-md">Détails des Abonnements</h3>
          <q-table :rows="organization.subscription" :columns="columns" row-key="_id" flat dense>
            <template v-slot:body="props">
              <q-tr :props="props">
                <q-td key="plan" :props="props"> {{ props.row.plan }} </q-td>
                <q-td key="price" :props="props"> {{ formatPrice(props.row.price) }} </q-td>
                <q-td key="seats" :props="props"> {{ props.row.seats }} </q-td>
                <q-td key="startDate" :props="props"> {{ formatDate(props.row.startDate) }} </q-td>
                <q-td key="endDate" :props="props"> {{ formatDate(props.row.endDate) }} </q-td>
                <q-td key="active" :props="props"> {{ props.row.active ? 'Oui' : 'Non' }} </q-td>
              </q-tr>
            </template>
          </q-table>
        </q-card-section>
        <q-card-section v-else class="q-mt-md">
          <q-banner dense color="grey-2"> Aucun abonnement en cours. </q-banner>
        </q-card-section>
      </q-card>

      <q-card>
        <q-card-section>
          <q-card class="card-bg no-shadow q-mt-sm" bordered>
            <q-card-section class="text-h6 q-pa-sm">
              <div class="text-h6">Mes factures</div>
              <q-list bordered separator class="q-mt-md">
                <q-item
                  clickable
                  v-ripple
                  v-for="subscription in subscriptions"
                  :key="subscription._id"
                >
                  <q-item-section>
                    <q-item-label
                      >Facture {{ subscription.plan }}
                      <span class="text-caption"> ({{ formatDate(subscription.startDate) }})</span>
                    </q-item-label>
                    <q-item-label
                      caption
                      @click="handleDownloadInvoice(subscription.invoice_details.invoice_pdf)"
                      >Cliquez pour télécharger</q-item-label
                    >
                  </q-item-section>

                  <q-item-section side>
                    <q-item-label caption
                      >{{ (subscription.price / 100).toFixed(2) }} €</q-item-label
                    >
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>
        </q-card-section>
      </q-card>
    </div>

    <!-- Message si aucune organisation n'est trouvée -->
    <div v-else>
      <q-banner class="q-mt-md" dense color="grey-2">
        Aucune organisation active trouvée.
      </q-banner>
    </div>
  </q-page>
</template>

<script lang="ts">
import { Notify } from 'quasar';
import { invokeApi } from 'src/services/ServicesUsers';
import { defineComponent, ref, onMounted, computed } from 'vue';
import { QTableColumn } from 'quasar';

type Email = string;

interface Subscription {
  _id: string;
  active: boolean;
  startDate: string;
  endDate: string;
  invoice: string;
  plan: string;
  price: number;
  seats: number;
  subscription: string;
  invoice_details: {
    id: string;
    invoice_pdf: string;
  };
}

interface Organization {
  _id: string;
  organization_name: string;
  members: Email[];
  subscription: Subscription[];
}

export default defineComponent({
  name: 'LegalmapMyOrganizations',
  setup() {
    // États réactifs
    const organization = ref<Organization | null>(null);
    const columns = ref<QTableColumn<Subscription>[]>([
      { name: 'plan', label: 'Plan', align: 'left', field: 'plan', sortable: true },
      { name: 'price', label: 'Prix', align: 'right', field: 'price', sortable: true },
      { name: 'seats', label: 'Places', align: 'right', field: 'seats', sortable: true },
      { name: 'startDate', label: 'Début', align: 'center', field: 'startDate', sortable: true },
      { name: 'endDate', label: 'Fin', align: 'center', field: 'endDate', sortable: true },
      { name: 'active', label: 'Actif', align: 'center', field: 'active', sortable: true },
    ]);

    const newMember = ref<Email>('');
    const isLoading = ref<boolean>(false);
    const isSaving = ref<boolean>(false);

    // Propriété calculée pour obtenir le nombre maximal de membres
    const getMaxMembers = computed<number>(() => {
      return organization.value?.subscription.reduce((acc, sub) => acc + sub.seats, 0) || 0;
    });

    // Fonction de validation d'email
    const isValidEmail = (email: string): boolean => {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(email);
    };

    // Fonction de formatage des dates
    const formatDate = (dateStr: string): string => {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Date invalide';
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    // Fonction de formatage des prix
    const formatPrice = (price: number): string => {
      return `${(price / 100).toFixed(2)} €`;
    };

    // Fonction pour ajouter un membre
    const handleAddMember = () => {
      const email = newMember.value.trim();
      if (!isValidEmail(email)) {
        Notify.create({
          message: 'Veuillez entrer un email valide',
          position: 'top',
          color: 'negative',
        });
        return;
      }

      if (organization.value?.members.includes(email)) {
        Notify.create({
          message: "Cet email est déjà membre de l'organisation",
          position: 'top',
          color: 'negative',
        });
        return;
      }

      if (
        organization.value?.members &&
        organization.value?.members.length >= getMaxMembers.value
      ) {
        Notify.create({
          message: 'Nombre maximum de membres atteint',
          position: 'top',
          color: 'negative',
        });
        return;
      }

      if (organization.value) {
        organization.value.members.push(email);
        Notify.create({
          message: 'Membre ajouté avec succès',
          color: 'positive',
        });
        newMember.value = '';
      }
    };

    // Fonction pour retirer un membre
    const handleRemoveMember = (member: Email) => {
      if (organization.value) {
        organization.value.members = organization.value.members.filter((m) => m !== member);
        Notify.create({
          message: 'Membre retiré avec succès',
          color: 'positive',
        });
      }
    };

    // Fonction pour sauvegarder les modifications de l'organisation
    const handleSave = async () => {
      if (!organization.value) return;

      isSaving.value = true;

      try {
        await invokeApi({
          index: 1,
          method: 'PUT',
          path: `/organizations/${organization.value._id}`,
          parameters: {
            organization_name: organization.value.organization_name,
            members: organization.value.members,
            subscription: organization.value.subscription,
          },
          useQueryString: false,
          forceRefreshToken: false,
        });

        Notify.create({
          message: 'Organisation sauvegardée avec succès',
          color: 'positive',
        });
      } catch (error) {
        console.error("Erreur lors de la sauvegarde de l'organisation :", error);
        Notify.create({
          message: "Erreur lors de la sauvegarde de l'organisation",
          color: 'negative',
        });
      } finally {
        isSaving.value = false;
      }
    };

    // Fonction pour récupérer les données de l'organisation active
    const fetchOrganization = async () => {
      isLoading.value = true;

      try {
        const response = await invokeApi({
          index: 1,
          method: 'GET',
          path: '/organizations/active',
          parameters: {},
          useQueryString: false,
          forceRefreshToken: false,
        });

        if (response.organization) {
          organization.value = response.organization;
        } else {
          organization.value = null;
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de l'organisation active :", error);
        Notify.create({
          message: "Erreur lors de la récupération de l'organisation active",
          color: 'negative',
        });
      } finally {
        isLoading.value = false;
      }
    };

    const subscriptions = ref<Subscription[]>([]);

    const getSubscriptions = async () => {
      const subscriptionsFetch = (
        await invokeApi({
          index: 1,
          method: 'GET',
          path: '/invoices/me',
          parameters: {},
          useQueryString: false,
          forceRefreshToken: false,
        })
      ).data as Subscription[];

      subscriptions.value = subscriptionsFetch;
    };

    const handleDownloadInvoice = async (invoice_pdf: string) => {
      try {
        window.location.href = invoice_pdf;
      } catch (error) {
        console.error(error);
      }
    };

    onMounted(() => {
      fetchOrganization();
      getSubscriptions();
    });

    return {
      organization,
      columns,
      handleAddMember,
      handleRemoveMember,
      newMember,
      getMaxMembers,
      handleSave,
      formatDate,
      formatPrice,
      isLoading,
      isSaving,
      isValidEmail,
      handleDownloadInvoice,
      subscriptions,
    };
  },
});
</script>

<style scoped>
.form-container {
  max-width: 600px;
  width: 100%;
}

.shadow-2 {
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
}

.rounded-borders {
  border-radius: 12px;
}
</style>
