<template>
  <q-page class="q-pa-md flex flex-center">
    <div class="form-container">
      <!-- Formulaire pour créer des codes promo -->
      <q-card class="q-pa-md shadow-2 rounded-borders">
        <q-card-section>
          <div class="text-h5 text-center q-mb-md">Générateur de Codes Promo</div>
          <q-form @submit="generateCodes">
            <q-input
              v-model="promoPercentage"
              label="Pourcentage de réduction (%)"
              type="number"
              filled
              :rules="[(val) => !!val || 'Le pourcentage est requis']"
              class="q-mb-md"
              dense
            />
            <q-input
              v-model="promoCount"
              label="Nombre de codes à générer"
              type="number"
              filled
              :rules="[(val) => !!val || 'Le nombre est requis']"
              class="q-mb-md"
              dense
            />
            <q-input
              v-model="durationMonth"
              label="Durée de l'abonnement (mois)"
              type="number"
              filled
              :rules="[(val) => !!val || 'La durée est requise']"
              class="q-mb-md"
              dense
            />
            <q-input
              v-model="expirationDate"
              label="Date d'expiration (YYYY-MM-DD)"
              type="date"
              filled
              :rules="[(val) => !!val || 'La date d\'expiration est requise']"
              class="q-mb-md"
              dense
            />
            <q-btn label="Générer" type="submit" color="primary" class="full-width q-mt-md" />
          </q-form>
        </q-card-section>
      </q-card>

      <!-- Tableau pour afficher les codes promo -->
      <q-card v-if="promoCodes.length" class="q-mt-md shadow-2">
        <q-card-section>
          <q-table :rows="promoCodes" :columns="columns" row-key="code" flat dense>
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
import moment from 'moment';

interface Code {
  index: number;
  code: string;
  coupon: {
    percent_off: number;
    valid: boolean;
    redeem_by: string;
    duration_in_months: number;
  };
  times_redeemed: number;
}

export default defineComponent({
  name: 'PromoCodeGenerator',
  setup() {
    const promoPercentage = ref<number | null>(null);
    const promoCount = ref<number | null>(null);
    const durationMonth = ref<number | null>(null);
    const expirationDate = ref<string | null>(null);
    const promoCodes = ref<Code[]>([]);

    const formatDate = (timestamp: string | number) => {
      const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
      return moment(ts * 1000).format('DD/MM/YYYY');
    };

    const columns = [
      { name: 'index', label: 'N°', align: 'left', field: 'index' },
      { name: 'code', label: 'Code Promo', align: 'left', field: 'code' },
      { name: 'percent_off', label: 'Pourcentage (%)', align: 'left', field: 'percent_off' },
      {
        name: 'duration_in_months',
        label: 'Durée (mois)',
        align: 'left',
        field: 'duration_in_months',
      },
      { name: 'redeem_by', label: "Date d'expiration", align: 'left', field: 'redeem_by' },
      {
        name: 'times_redeemed',
        label: "Nombre d'utilisations",
        align: 'left',
        field: 'times_redeemed',
      },
    ];

    const generateCodes = async () => {
      try {
        if (
          expirationDate.value &&
          durationMonth.value &&
          promoPercentage.value &&
          promoCount.value
        ) {
          await invokeApi({
            index: 1,
            method: 'POST',
            path: '/coupons',
            parameters: {
              expiration_date: expirationDate.value,
              duration_month: parseInt(durationMonth.value.toString(), 10),
              percent: parseInt(promoPercentage.value.toString(), 10),
              num_codes: parseInt(promoCount.value.toString(), 10),
            },
            useQueryString: false,
            forceRefreshToken: false,
          });

          Notify.create({
            message: 'Codes générés avec succès',
            color: 'positive',
          });

          getCodes(); // Récupérer les codes promo après la génération
        } else {
          Notify.create({
            message: 'Veuillez remplir tous les champs avant de générer des codes promo.',
            color: 'negative',
          });
        }
      } catch (error) {
        Notify.create({
          message: 'Erreur lors de la génération des codes promo',
          color: 'negative',
        });
      }
    };

    const getCodes = async () => {
      try {
        const response = await invokeApi({
          index: 1,
          method: 'GET',
          path: '/coupons',
          parameters: {},
          useQueryString: false,
          forceRefreshToken: false,
        });

        promoCodes.value = response.map((code: Code, index: number) => ({
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
      } catch (error) {
        console.error('Erreur lors de la récupération des codes promo :', error);
      }
    };

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
      getCodes,
    };
  },
});
</script>

<style scoped>
.full-width {
  width: 100%;
}

.form-container {
  max-width: 500px;
  width: 100%;
}

.shadow-2 {
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
}

.rounded-borders {
  border-radius: 12px;
}
</style>
