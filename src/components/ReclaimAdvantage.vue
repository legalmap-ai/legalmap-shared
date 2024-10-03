<template>
  <q-card class="q-pa-sm card-style q-mb-md">
    <div class="row items-center q-gutter-md full-width">
      <q-img
        src="https://cdn-icons-png.flaticon.com/128/1196/1196240.png"
        class="gift-img"
        style="width: 40px; height: 40px"
      />

      <div>
        <div class="text-subtitle1 text-grey-7">Réclamer mon avantage</div>
        <div class="text-h6 font-bold">
          WATCH <span class="text-caption">abonnement gratuit</span>
        </div>
      </div>

      <q-spacer />

      <q-btn
        outline
        label="Réclamer"
        color="primary"
        icon="redeem"
        class="ml-auto rounded-button q-px-md q-mr-md"
        @click="openPopup"
      />
    </div>
  </q-card>

  <q-dialog
    v-model="isPopupOpen"
    persistent
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="q-pa-md card-style">
      <q-card-section class="row items-center q-py-md">
        <div class="text-h6">Entrez votre code avantage</div>
        <q-input v-model="code" label="Code avantage" filled dense class="q-ml-md input-style" />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          label="Annuler"
          color="negative"
          v-close-popup
          class="rounded-button q-px-md q-py-sm"
        />
        <q-btn
          label="Vérifier"
          color="primary"
          unelevated
          @click="checkCode"
          class="rounded-button q-px-md q-py-sm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog
    v-model="isResultPopupOpen"
    persistent
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="q-pa-md card-style">
      <q-card-section class="q-py-md">
        <div class="text-h6">{{ resultMessage }}</div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          label="Fermer"
          color="primary"
          v-close-popup
          class="rounded-button q-px-md q-py-sm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { ref } from 'vue';
import { QCard, QImg, QBtn, QDialog, QCardSection, QCardActions, QInput } from 'quasar';

export default {
  name: 'ReclaimAdvantage',
  components: {
    QCard,
    QImg,
    QBtn,
    QDialog,
    QCardSection,
    QCardActions,
    QInput,
  },
  setup() {
    const isPopupOpen = ref(false);
    const isResultPopupOpen = ref(false);
    const code = ref('');
    const resultMessage = ref('');

    const openPopup = () => {
      isPopupOpen.value = true;
    };

    const checkCode = () => {
      isPopupOpen.value = false;

      if (code.value === '1234') {
        resultMessage.value = "🎉 Félicitations ! Vous avez obtenu l'avantage.";
      } else {
        resultMessage.value = '❌ Code incorrect. Veuillez réessayer.';
      }

      isResultPopupOpen.value = true;
    };

    return {
      isPopupOpen,
      isResultPopupOpen,
      code,
      resultMessage,
      openPopup,
      checkCode,
    };
  },
};
</script>

<style scoped>
.card-style {
  border-radius: 16px;
  box-shadow: 0 0px 6px 5px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
}

.gift-img {
  width: 80px;
  height: 80px;
}

.rounded-button {
  border-radius: 4px;
}

.q-pa-lg {
  padding: 24px;
}

.ml-auto {
  margin-left: auto;
}
</style>
