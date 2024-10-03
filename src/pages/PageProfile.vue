<template>
  <q-page class="q-pa-sm">
    <div v-if="access_token">
      <div class="q-pa-sm"><b>Identifié en tant que:</b> {{ login_id }}</div>
      <q-separator />
      <div class="q-pa-sm"><b>Heure de connexion:</b> {{ auth_time_date }} ({{ auth_time }})</div>
      <q-separator />
      <div class="q-pa-sm"><b>Token:</b> {{ access_token }}</div>
      <q-separator />
      <div class="q-pa-sm"><b>Groupes:</b> {{ user_groups }}</div>
      <q-separator />
      <div class="q-pa-sm">
        <q-btn
          label="Log Out"
          class="text-capitalize"
          rounded
          color="info"
          style="max-width: 120px"
          @click="logOut"
        ></q-btn>
      </div>
    </div>
    <q-card-section v-if="error_message" class="text-negative">
      Erreur: {{ error_message }}
    </q-card-section>
    <div class="row q-col-gutter-sm">
      <UpdateProfileInformations :profile="profile" />

      <div class="col-lg-12 col-md-12 col-xs-12 col-sm-12">
        <q-card class="card-bg no-shadow" bordered>
          <q-card-section class="text-h6 q-pa-sm">
            <div class="text-h6">Modifier mon mot de passe</div>
          </q-card-section>
          <q-card-section class="q-pa-sm row">
            <q-item class="col-lg-4 col-md-4 col-sm-12 col-xs-12">
              <q-item-section> Current Password </q-item-section>
            </q-item>
            <q-item class="col-lg-8 col-md-8 col-sm-12 col-xs-12">
              <q-item-section>
                <q-input
                  type="password"
                  dense
                  outlined
                  color="white"
                  round
                  v-model="password_dict.current_password"
                  label="Current Password"
                />
              </q-item-section>
            </q-item>
            <q-item class="col-lg-4 col-md-4 col-sm-12 col-xs-12">
              <q-item-section> New Password </q-item-section>
            </q-item>
            <q-item class="col-lg-8 col-md-8 col-sm-12 col-xs-12">
              <q-item-section>
                <q-input
                  type="password"
                  dense
                  outlined
                  color="white"
                  round
                  v-model="password_dict.new_password"
                  label="New Password"
                />
              </q-item-section>
            </q-item>
            <q-item class="col-lg-4 col-md-4 col-sm-12 col-xs-12">
              <q-item-section> Confirm New Password </q-item-section>
            </q-item>
            <q-item class="col-lg-8 col-md-8 col-sm-12 col-xs-12">
              <q-item-section>
                <q-input
                  type="password"
                  dense
                  outlined
                  round
                  color="white"
                  v-model="password_dict.confirm_new_password"
                  label="Confirm New Password"
                />
              </q-item-section>
            </q-item>
          </q-card-section>

          <q-card-section v-if="error_update_message" class="text-negative">
            Erreur: {{ error_update_message }}
          </q-card-section>

          <q-card-actions align="right">
            <q-btn class="text-capitalize bg-info text-white" @click="handleResetPassword"
              >Changer mon mot de passe</q-btn
            >
          </q-card-actions>
        </q-card>

        <!-- <q-card class="card-bg no-shadow q-mt-sm" bordered>
          <q-card-section class="text-h6 q-pa-sm">
            <div class="text-h6">Mes factures</div>
            <q-list bordered separator class="q-mt-md">
              subscription in subscriptions
              <q-item clickable v-ripple v-for="subscription in 3" :key="subscription.id">
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
                  <q-item-label caption>{{ (subscription.price / 100).toFixed(2) }} €</q-item-label>
                </q-item-section>
              </q-item>

            </q-list>
          </q-card-section>
        </q-card> -->
      </div>
    </div>
  </q-page>
</template>

<style lang="scss" scoped></style>

<script lang="ts">
import { QueryError } from '../utils/api.utils';
import { useAuthStore } from '../stores/store-auth';
import { computed, defineComponent, onMounted, Ref, ref } from 'vue';
import { translateError } from '../utils/errors.utils';
import { Profile } from '../types/profile';
import UpdateProfileInformations from '../components/UpdateProfileInformations.vue';
import { invokeApi } from '../services/ServicesUsers';
import { isValidPassword } from 'src/utils/accounts.util';

interface Invoice {
  id: string;
  invoice_pdf: string;
}

interface Subscription {
  id: string;
  invoice: string;
  active: boolean;
  endDate: string;
  startDate: string;
  invoice_details: Invoice;
  plan: string;
  price: number;
  subscription: string;
}

export default defineComponent({
  components: {
    UpdateProfileInformations,
  },
  name: 'LegalmapPages',
  props: {},
  setup() {
    const authStore = useAuthStore();
    const error_message = ref<string | null>(null);
    const error_update_message = ref<string | null>(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const access_token = ref<any>(null);
    const login_id = ref<string | null>(null);
    const user_groups = ref<[string] | []>([]);
    const auth_time = ref<number | null>(null);
    const auth_time_date = ref<string | null>(null);
    const profileId = ref<string>('');

    const profile = ref({
      email: 'matteokocken@gmail.com',
      given_name: 'Matteo',
      family_name: 'Kocken',
    }) as Ref<Profile>;

    const password_dict = ref({
      current_password: '',
      new_password: '',
      confirm_new_password: '',
    });

    const subscriptions = ref(null) as Ref<Subscription[] | null>;

    onMounted(() => {
      getUserState();
      getSubscriptions();
    });

    const getUserState = async () => {
      try {
        access_token.value = await authStore.getAccessToken();
        login_id.value = await authStore.getLoginId();
        auth_time.value = await authStore.getAuthTime();
        auth_time_date.value = await authStore.getAuthTimeDate();
        user_groups.value = await authStore.getGroups();
        profileId.value = await authStore.getUserId();

        profile.value = {
          id: profileId.value,
          email: 'matteokocken@gmail.com',
          given_name: 'Matteo',
          family_name: 'Kocken',
        } as Profile;
      } catch (error) {
        error_message.value = translateError(error as QueryError);
        access_token.value = null;
      }
    };

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

    const logOut = async () => {
      try {
        const res = await authStore.logOut();
        access_token.value = res;
      } catch (error) {
        access_token.value = null;
        console.error(error);
      }
    };

    const handleResetPassword = async () => {
      try {
        if (isValidPassword(password_dict.value.new_password) !== '') {
          error_update_message.value = isValidPassword(password_dict.value.new_password);
          return;
        }

        if (password_dict.value.new_password !== password_dict.value.confirm_new_password) {
          error_update_message.value = 'Les mots de passe ne correspondent pas';
          return;
        }

        await authStore.resetPasswordUser(
          password_dict.value.current_password,
          password_dict.value.new_password
        );
      } catch (error) {
        error_update_message.value = 'Votre mot de passe actuel est incorrect';
      }
    };

    const formatDate = computed(() => (date: string) => {
      const dateObj = new Date(date);
      return `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
    });

    return {
      error_message,
      error_update_message,
      access_token,
      user_groups,
      login_id,
      auth_time,
      auth_time_date,
      subscriptions,
      getSubscriptions,
      logOut,
      handleDownloadInvoice,
      authStore,
      profile,
      password_dict,
      formatDate,
      handleResetPassword,
    };
  },
});
</script>
