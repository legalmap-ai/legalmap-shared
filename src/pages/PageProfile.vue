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
      <div class="col-lg-12 col-md-12 col-xs-12 col-sm-12">
        <q-card>
          <!-- <BaseButton @click="handleSubscribe"
            >Souscrire à un abonnement</BaseButton
          > -->
        </q-card>

        <q-card class="card-bg no-shadow" bordered>
          <q-card-section class="text-h6">
            <div class="text-h6">Mon profil</div>
            <div class="text-subtitle2">Compléter mon profil</div>
          </q-card-section>
          <q-card-section class="q-pa-sm">
            <q-list class="row">
              <q-item class="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                <q-item-section side>
                  <q-avatar size="100px">
                    <img src="https://cdn.quasar.dev/img/boy-avatar.png" />
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-btn
                    label="Add Photo"
                    class="text-capitalize"
                    rounded
                    color="info"
                    style="max-width: 120px"
                  ></q-btn>
                </q-item-section>
              </q-item>

              <q-item class="col-lg-6 col-md-6 col-sm-12 col-xs-12">
                <q-item-section>
                  <q-input color="black" dense v-model="user_details.user_name" label="User Name" />
                </q-item-section>
              </q-item>
              <q-item class="col-lg-6 col-md-6 col-sm-12 col-xs-12">
                <q-item-section>
                  <q-input color="black" dense v-model="user_details.email" label="Email Address" />
                </q-item-section>
              </q-item>
              <q-item class="col-lg-6 col-md-6 col-sm-12 col-xs-12">
                <q-item-section>
                  <q-input
                    color="black"
                    dense
                    v-model="user_details.first_name"
                    label="First Name"
                  />
                </q-item-section>
              </q-item>
              <q-item class="col-lg-6 col-md-6 col-sm-12 col-xs-12">
                <q-item-section>
                  <q-input color="black" dense v-model="user_details.last_name" label="Last Name" />
                </q-item-section>
              </q-item>
              <q-item class="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                <q-item-section>
                  <q-input
                    color="black"
                    autogrow
                    dense
                    v-model="user_details.address"
                    label="Address"
                  />
                </q-item-section>
              </q-item>
              <q-item class="col-lg-6 col-md-6 col-sm-12 col-xs-12">
                <q-item-section>
                  <q-input color="black" dense v-model="user_details.city" label="City" />
                </q-item-section>
              </q-item>
              <q-item class="col-lg-6 col-md-6 col-sm-12 col-xs-12">
                <q-item-section>
                  <q-input
                    color="black"
                    dense
                    v-model="user_details.post_code"
                    label="Postal Code"
                  />
                </q-item-section>
              </q-item>
              <q-item class="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                <q-item-section>
                  <q-input
                    color="black"
                    type="textarea"
                    dense
                    v-model="user_details.about"
                    label="About"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn class="text-capitalize bg-info text-white">Update User Info</q-btn>
          </q-card-actions>
        </q-card>
      </div>

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
                  dark
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
                  dark
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
                  dark
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
          <q-card-actions align="right">
            <q-btn class="text-capitalize bg-info text-white">Change Password</q-btn>
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<style lang="scss" scoped></style>

<script lang="ts">
import { QueryError } from '../utils/api.utils';
import { useAuthStore } from '../stores/store-auth';
import { defineComponent, onMounted, ref } from 'vue';
import { translateError } from '../utils/errors.utils';

export default defineComponent({
  name: 'LegalmapPages',
  props: {},
  setup() {
    const authStore = useAuthStore();
    const error_message = ref<string | null>(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const access_token = ref<any>(null);
    const login_id = ref<string | null>(null);
    const user_groups = ref<[string] | []>([]);
    const auth_time = ref<number | null>(null);
    const auth_time_date = ref<string | null>(null);
    onMounted(() => {
      getUserState();
    });

    const getUserState = async () => {
      try {
        access_token.value = await authStore.getAccessToken();
        login_id.value = await authStore.getLoginId();
        auth_time.value = await authStore.getAuthTime();
        auth_time_date.value = await authStore.getAuthTimeDate();
        user_groups.value = await authStore.getGroups();
      } catch (error) {
        error_message.value = translateError(error as QueryError);
        access_token.value = null;
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
    // const getMoreInformation = async () => {
    //   console.log(await UsersService.getAuthenticatedUser());
    // };

    const user_details = ref({
      user_name: '',
      email: '',
      first_name: '',
      last_name: '',
      address: '',
      city: '',
      post_code: '',
      about: '',
    });

    const password_dict = ref({
      current_password: '',
      new_password: '',
      confirm_new_password: '',
    });

    // const handleSubscribe = () => {
    //   usersService.subscribeToPlan();
    // };
    return {
      error_message,
      access_token,
      user_groups,
      login_id,
      auth_time,
      auth_time_date,
      logOut,
      authStore,
      user_details,
      password_dict,
    };
  },
});
</script>
