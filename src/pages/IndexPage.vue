<template>
  <q-page padding>
    <h1 class="text-h4 q-mb-md">Tableau de bord</h1>

    <div class="row q-col-gutter-md">
      <!-- Statistiques rapides -->
      <div class="col-12 col-md-3" v-for="stat in quickStats" :key="stat.label">
        <q-card>
          <q-card-section>
            <div class="text-h6">{{ stat.label }}</div>
            <div class="text-h4 text-weight-bold">{{ stat.value }}</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Graphique des nouveaux clients -->
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6">Nouveaux clients (30 derniers jours)</div>
            <!-- Insérez ici un composant de graphique, par exemple avec Chart.js ou ApexCharts -->
          </q-card-section>
        </q-card>
      </div>

      <!-- Graphique des revenus -->
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6">Revenus mensuels</div>
            <!-- Insérez ici un composant de graphique -->
          </q-card-section>
        </q-card>
      </div>

      <!-- Liste des derniers clients inscrits -->
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6">Derniers clients inscrits</div>
            <q-list>
              <q-item v-for="client in recentClients" :key="client.id">
                <q-item-section>
                  <q-item-label>{{ client.name }}</q-item-label>
                  <q-item-label caption>Inscrit le {{ client.date }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>

      <!-- Liste des abonnements expirant bientôt -->
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6">Abonnements expirant bientôt</div>
            <q-list>
              <q-item v-for="sub in expiringSubscriptions" :key="sub.id">
                <q-item-section>
                  <q-item-label>{{ sub.clientName }}</q-item-label>
                  <q-item-label caption>Expire le {{ sub.expiryDate }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
import { useAuthStore } from 'src/stores/store-auth';
import { defineComponent, onMounted, ref } from 'vue';

const quickStats = ref([
  { label: 'Clients totaux', value: 1234 },
  { label: 'Abonnements actifs', value: 987 },
  { label: 'Revenu mensuel', value: '9876 €' },
  { label: 'Taux de rétention', value: '95%' },
]);

const recentClients = ref([
  { id: 1, name: 'Alice Dupont', date: '2024-09-05' },
  { id: 2, name: 'Bob Martin', date: '2024-09-04' },
  { id: 3, name: 'Claire Leblanc', date: '2024-09-03' },
]);

const expiringSubscriptions = ref([
  { id: 1, clientName: 'Entreprise A', expiryDate: '2024-09-15' },
  { id: 2, clientName: 'Société B', expiryDate: '2024-09-20' },
  { id: 3, clientName: 'Startup C', expiryDate: '2024-09-25' },
]);

export default defineComponent({
  name: 'IndexPage',

  setup() {
    onMounted(() => {
      const authStore = useAuthStore();
      authStore.redirectIfNotLoggedIn();
    });

    return {
      quickStats,
      recentClients,
      expiringSubscriptions,
    };
  },
});
</script>
