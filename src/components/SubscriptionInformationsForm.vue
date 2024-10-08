<template>
  <div style="width: 1200px; max-width: 90vw">
    <q-card>
      <q-card-section>
        <div class="text-h6">Facturation</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="handleSubmit" ref="formRef">
          <div class="flex no-wrap q-gutter-xl">
            <q-input
              style="flex: 1"
              v-model="form.name"
              label="Nom Complet"
              :rules="[(val) => (val && val.length > 0) || 'Nom requis']"
              required
              dense
            />

            <q-input
              style="flex: 1"
              v-model="form.email"
              dense
              label="Adresse E-mail"
              type="email"
              :rules="[(val) => /.+@.+\..+/.test(val) || 'E-mail invalide']"
              required
            />
          </div>

          <q-input v-model="form.phone" label="Numéro de Téléphone" type="tel" dense />

          <q-input
            v-model="form.companyName"
            label="Nom de l'Entreprise"
            :rules="[(val) => (val && val.length > 0) || 'Nom de l\'entreprise requis']"
            required
            dense
          />

          <div class="flex no-wrap q-gutter-xl">
            <q-input
              style="flex: 1"
              v-model="form.siren"
              label="Numéro SIREN"
              mask="#########"
              :rules="[(val) => /^\d{9}$/.test(val) || 'SIREN invalide']"
              required
              dense
            />

            <q-input
              style="flex: 1"
              v-model="form.siret"
              label="Numéro SIRET"
              mask="##############"
              :rules="[(val) => /^\d{14}$/.test(val) || 'SIRET invalide']"
              required
              dense
            />
          </div>

          <q-input
            v-model="form.address.line1"
            label="Adresse Ligne 1"
            :rules="[(val) => (val && val.length > 0) || 'Adresse requise']"
            required
            dense
          />

          <q-input v-model="form.address.line2" label="Adresse Ligne 2" dense />

          <div class="flex no-wrap q-gutter-xl">
            <q-input
              v-model="form.address.city"
              style="flex: 1"
              label="Ville"
              :rules="[(val) => (val && val.length > 0) || 'Ville requise']"
              required
              dense
            />

            <q-input
              v-model="form.address.postal_code"
              style="flex: 1"
              label="Code Postal"
              mask="#####"
              :rules="[(val) => /^\d{5}$/.test(val) || 'Code postal invalide']"
              required
              dense
            />
          </div>

          <q-input v-model="form.address.country" label="Pays" required dense />

          <!-- Champs additionnels si nécessaire -->

          <q-btn
            type="submit"
            label="Continuer"
            color="primary"
            :loading="loading"
            class="full-width"
          />
        </q-form>
      </q-card-section>

      <q-card-section v-if="errorMessage">
        <q-banner class="bg-negative text-white">
          {{ errorMessage }}
        </q-banner>
      </q-card-section>

      <q-card-section v-if="successMessage">
        <q-banner class="bg-positive text-white">
          {{ successMessage }}
        </q-banner>
      </q-card-section>
    </q-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { Notify, useQuasar } from 'quasar';
import { invokeApi } from 'src/services/ServicesUsers';

interface Address {
  line1: string;
  line2?: string;
  city: string;
  postal_code: string;
  country: string;
}

interface Form {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  companyName: string;
  siren: string;
  siret: string;
  address: Address;
}

export default defineComponent({
  name: 'SubscriptionForm',
  emits: ['submit'],
  setup(_, { emit }) {
    const $q = useQuasar();
    const formRef = ref<InstanceType<typeof import('quasar').QForm> | null>(null);

    const form = ref<Form>({
      _id: '',
      name: '',
      email: '',
      phone: '',
      companyName: '',
      siren: '',
      siret: '',
      address: {
        line1: '',
        line2: '',
        city: '',
        postal_code: '',
        country: '',
      },
    });

    const loading = ref(false);
    const errorMessage = ref('');
    const successMessage = ref('');

    const handleFetch = async () => {
      try {
        const res = await invokeApi({
          index: 1,
          method: 'GET',
          path: '/organizations/active',
          parameters: {},
          useQueryString: false,
          forceRefreshToken: false,
        });

        console.log(res.organization);

        form.value = {
          ...form.value,
          ...res.organization.informations,
        };
        form.value._id = res.organization._id;
      } catch (error) {
        console.error(error);
        errorMessage.value = 'Une erreur est survenue.';
      }
    };

    onMounted(() => {
      handleFetch();
    });

    const handleSubmit = async () => {
      if (!formRef.value) return;

      const isValid = await formRef.value.validate();
      if (!isValid) {
        $q.notify({
          type: 'negative',
          message: 'Veuillez corriger les erreurs dans le formulaire.',
        });
        return;
      }

      loading.value = true;
      errorMessage.value = '';
      successMessage.value = '';

      try {
        // Préparer les données à envoyer à votre backend
        const payload = {
          name: form.value.name,
          email: form.value.email,
          phone: form.value.phone,
          companyName: form.value.companyName,
          siren: form.value.siren,
          siret: form.value.siret,
          address: form.value.address,
        };

        invokeApi({
          index: 1,
          method: 'PUT',
          path: '/organizations/' + form.value._id,
          parameters: {
            informations: payload,
          },
          useQueryString: false,
          forceRefreshToken: false,
        });

        Notify.create({
          message: 'Informations mises à jour avec succès.',
          color: 'positive',
        });

        emit('submit');
      } catch (error) {
        console.error(error);
        errorMessage.value = 'Une erreur est survenue.';
      } finally {
        loading.value = false;
      }
    };

    return {
      form,
      loading,
      errorMessage,
      successMessage,
      handleSubmit,
      formRef,
    };
  },
});
</script>

<style scoped>
.q-page {
  max-width: 600px;
  margin: auto;
}
</style>
