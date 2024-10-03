<template>
  <q-page class="q-pa-md flex flex-center">
    <div class="form-container">
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
            <q-btn label="Générer" type="submit" color="primary" class="full-width q-mt-md" />
          </q-form>
        </q-card-section>
      </q-card>

      <q-card v-if="promoCodes.length" class="q-mt-md shadow-2">
        <q-card-section>
          <q-table :rows="promoCodes" :columns="columns" row-key="code" flat dense>
            <template v-slot:body-cell-index="props">
              <q-td :props="props">
                {{ props.row.index + 1 }}
              </q-td>
            </template>
            <template v-slot:body-cell-code="props">
              <q-td :props="props">
                {{ props.row.code }}
              </q-td>
            </template>
            <template v-slot:body-cell-percentage="props">
              <q-td :props="props"> {{ props.row.percentage }}% </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'PromoCodeGenerator',
  setup() {
    const promoPercentage = ref<number | null>(null);
    const promoCount = ref<number | null>(null);
    const promoCodes = ref<{ index: number; code: string; percentage: number }[]>([]);

    const columns = [
      { name: 'index', label: 'N°', align: 'left', field: 'index' },
      { name: 'code', label: 'Code Promo', align: 'left', field: 'code' },
      { name: 'percentage', label: 'Pourcentage (%)', align: 'left', field: 'percentage' },
    ];

    const generateCode = (): string => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    const generateCodes = () => {
      if (promoPercentage.value && promoCount.value) {
        promoCodes.value = [];
        for (let i = 0; i < promoCount.value; i++) {
          promoCodes.value.push({
            index: i,
            code: generateCode(),
            percentage: promoPercentage.value!,
          });
        }
      }
    };

    return {
      promoPercentage,
      promoCount,
      promoCodes,
      columns,
      generateCodes,
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
