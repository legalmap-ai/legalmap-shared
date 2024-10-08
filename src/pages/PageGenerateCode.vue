<template>
  <q-page class="q-pa-md flex flex-center">
    <div class="form-container">
      <!-- Formulaire pour créer des codes promo -->
      <q-card class="q-pa-md shadow-2 rounded-borders">
        <q-card-section>
          <div class="text-h5 text-center q-mb-md">Générateur de Codes Promo</div>
          <q-form @submit.prevent="generateCodes">
            <q-input
              v-model.number="promoPercentage"
              label="Pourcentage de réduction (%)"
              type="number"
              filled
              :rules="[
                (val) =>
                  (val !== null && val >= 0 && val <= 100) ||
                  'Entrez un pourcentage valide (0-100)',
                (val) => val !== null || 'Le pourcentage est requis',
              ]"
              class="q-mb-md"
              dense
            />
            <q-input
              v-model.number="promoCount"
              label="Nombre de codes à générer"
              type="number"
              filled
              :rules="[
                (val) => (val !== null && val > 0) || 'Entrez un nombre valide',
                (val) => val !== null || 'Le nombre est requis',
              ]"
              class="q-mb-md"
              dense
            />
            <q-input
              v-model.number="durationMonth"
              label="Durée de l'abonnement (mois)"
              type="number"
              filled
              :rules="[
                (val) => (val !== null && val > 0) || 'Entrez une durée valide',
                (val) => val !== null || 'La durée est requise',
              ]"
              class="q-mb-md"
              dense
            />
            <q-input
              v-model="expirationDate"
              label="Date d'expiration"
              type="date"
              filled
              :rules="[
                (val) => !!val || 'La date d\'expiration est requise',
                (val) => isValidDate(val) || 'Entrez une date valide',
              ]"
              class="q-mb-md"
              dense
            />
            <q-btn
              label="Générer"
              type="submit"
              color="primary"
              class="full-width q-mt-md"
              :loading="isGenerating"
              :disabled="isGenerating"
            />
          </q-form>
        </q-card-section>
      </q-card>

      <!-- Tableau pour afficher les codes promo -->
      <q-card v-if="promoCodes.length" class="q-mt-md shadow-2">
        <q-card-section>
          <q-table
            :rows="promoCodes"
            :columns="columns"
            row-key="code"
            flat
            dense
            :loading="isLoading"
          >
            <template v-slot:body="props">
              <q-tr :props="props">
                <q-td key="index" :props="props"> {{ props.row.index }} </q-td>
                <q-td key="code" :props="props">
                  {{ props.row.code }}
                </q-td>
                <q-td key="percent_off" :props="props"> {{ props.row.coupon.percent_off }}% </q-td>
                <q-td key="duration_in_months" :props="props">
                  {{ props.row.coupon.duration_in_months }}
                </q-td>
                <q-td key="redeem_by" :props="props">
                  {{ formatDate(props.row.coupon.redeem_by) }}
                </q-td>
                <q-td key="times_redeemed" :props="props"> {{ props.row.times_redeemed }} </q-td>
              </q-tr>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script lang="ts">
import { Notify } from 'quasar';
import { invokeApi } from 'src/services/ServicesUsers';
import { defineComponent, ref, onMounted } from 'vue';
import { QTableColumn } from 'quasar';
import { useRouter } from 'vue-router';

interface Coupon {
  percent_off: number;
  valid: boolean;
  redeem_by: string; // Format: 'YYYY-MM-DD'
  duration_in_months: number;
}

interface Code {
  index: number;
  code: string;
  coupon: Coupon;
  times_redeemed: number;
}

export default defineComponent({
  name: 'PromoCodeGenerator',
  setup() {
    // États réactifs
    const promoPercentage = ref<number | null>(null);
    const promoCount = ref<number | null>(null);
    const durationMonth = ref<number | null>(null);
    const expirationDate = ref<string | null>(null);
    const promoCodes = ref<Code[]>([]);
    const isGenerating = ref(false);
    const isLoading = ref(false);
    const router = useRouter();

    // Colonnes du tableau avec typage explicite
    const columns: QTableColumn<Code>[] = [
      { name: 'index', label: 'N°', align: 'left', field: 'index', sortable: true },
      { name: 'code', label: 'Code Promo', align: 'left', field: 'code', sortable: true },
      {
        name: 'percent_off',
        label: 'Pourcentage (%)',
        align: 'left',
        field: (row: Code) => row.coupon.percent_off,
        sortable: true,
      },
      {
        name: 'duration_in_months',
        label: 'Durée (mois)',
        align: 'left',
        field: (row: Code) => row.coupon.duration_in_months,
        sortable: true,
      },
      {
        name: 'redeem_by',
        label: "Date d'expiration",
        align: 'left',
        field: (row: Code) => parseInt(row.coupon.redeem_by),
        sortable: true,
      },
      {
        name: 'times_redeemed',
        label: "Nombre d'utilisations",
        align: 'left',
        field: 'times_redeemed',
        sortable: true,
      },
    ];

    // Fonction de validation de la date
    const isValidDate = (dateStr: string): boolean => {
      const date = new Date(dateStr);
      return !isNaN(date.getTime());
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

    // Fonction pour générer des codes promo
    const generateCodes = async () => {
      // Validation supplémentaire avant de générer
      if (
        promoPercentage.value === null ||
        promoCount.value === null ||
        durationMonth.value === null ||
        expirationDate.value === null
      ) {
        Notify.create({
          message: 'Veuillez remplir tous les champs avant de générer des codes promo.',
          color: 'negative',
        });
        return;
      }

      isGenerating.value = true;

      try {
        await invokeApi({
          index: 1,
          method: 'POST',
          path: '/coupons',
          parameters: {
            expiration_date: expirationDate.value,
            duration_month: durationMonth.value,
            percent: promoPercentage.value,
            num_codes: promoCount.value,
          },
          useQueryString: false,
          forceRefreshToken: false,
        });

        Notify.create({
          message: 'Codes générés avec succès',
          color: 'positive',
        });

        getCodes(); // Récupérer les codes promo après la génération
      } catch (error) {
        console.error('Erreur lors de la génération des codes promo :', error);
        Notify.create({
          message: 'Erreur lors de la génération des codes promo',
          color: 'negative',
        });
      } finally {
        isGenerating.value = false;
      }
    };

    // Fonction pour récupérer les codes promo
    const getCodes = async () => {
      isLoading.value = true;
      try {
        const response = await invokeApi({
          index: 1,
          method: 'GET',
          path: '/coupons',
          parameters: {},
          useQueryString: false,
          forceRefreshToken: false,
        });

        if (Array.isArray(response)) {
          promoCodes.value = response.map((code: Omit<Code, 'index'>, index: number) => ({
            index: index + 1,
            code: code.code,
            coupon: {
              percent_off: code.coupon.percent_off,
              valid: code.coupon.valid,
              redeem_by: code.coupon.redeem_by,
              duration_in_months: code.coupon.duration_in_months,
            },
            times_redeemed: code.times_redeemed,
          }));
        } else {
          console.error('Format de réponse inattendu:', response);
          Notify.create({
            message: 'Format de réponse inattendu lors de la récupération des codes promo',
            color: 'negative',
          });
        }
      } catch (error) {
        Notify.create({
          message: "Vous n'êtes pas autorisé à accéder à cette ressource",
          color: 'negative',
        });
        router.push('/');
      } finally {
        isLoading.value = false;
      }
    };

    // Appel initial pour récupérer les codes promo
    onMounted(() => {
      getCodes();
    });

    return {
      promoPercentage,
      promoCount,
      durationMonth,
      expirationDate,
      promoCodes,
      columns,
      formatDate,
      generateCodes,
      isGenerating,
      isLoading,
      isValidDate,
    };
  },
});
</script>

<style scoped>
.full-width {
  width: 100%;
}

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
