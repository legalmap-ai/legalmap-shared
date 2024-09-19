<template>
  <div class="col-lg-12 col-md-12 col-xs-12 col-sm-12">
    <q-card class="card-bg no-shadow" bordered>
      <q-card-section class="text-h6">
        <div class="text-h6">Mon profil</div>
        <div class="text-subtitle2">Compléter mon profil</div>
      </q-card-section>
      <q-card-section class="q-pa-sm">
        <q-list class="row">
          <q-item class="col-lg-6 col-md-6 col-sm-12 col-xs-12">
            <q-item-section>
              <q-input color="black" dense v-model="localProfile.email" label="Email Address" />
            </q-item-section>
          </q-item>
          <q-item class="col-lg-6 col-md-6 col-sm-12 col-xs-12">
            <q-item-section>
              <q-input color="black" dense v-model="localProfile.given_name" label="First Name" />
            </q-item-section>
          </q-item>
          <q-item class="col-lg-6 col-md-6 col-sm-12 col-xs-12">
            <q-item-section>
              <q-input color="black" dense v-model="localProfile.family_name" label="Last Name" />
            </q-item-section>
          </q-item>
          <!--<q-item class="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                <q-item-section>
                  <q-input color="black" autogrow dense v-model="profile.address" label="Address" />
                </q-item-section>
              </q-item>
              <q-item class="col-lg-6 col-md-6 col-sm-12 col-xs-12">
                <q-item-section>
                  <q-input color="black" dense v-model="profile.city" label="City" />
                </q-item-section>
              </q-item>
              <q-item class="col-lg-6 col-md-6 col-sm-12 col-xs-12">
                <q-item-section>
                  <q-input color="black" dense v-model="profile.post_code" label="Postal Code" />
                </q-item-section>
              </q-item>
              <q-item class="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                <q-item-section>
                  <q-input
                    color="black"
                    type="textarea"
                    dense
                    v-model="profile.about"
                    label="About"
                  />
                </q-item-section>
              </q-item>
              -->
        </q-list>

        <div v-if="error" class="text-negative">{{ error }}</div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn class="bg-info text-white" @click="handleUpdateProfile" :disabled="loading">
          {{ loading ? 'Chargement...' : 'Mettre à jour' }}
        </q-btn>
      </q-card-actions>
    </q-card>
  </div>
</template>

<script lang="ts">
import { AxiosError } from 'axios';
import { Notify } from 'quasar';
import { invokeApi } from 'src/services/ServicesUsers';
import { Profile } from 'src/types/profile';
import { QueryError } from 'src/utils/api.utils';
import { translateError } from 'src/utils/errors.utils';
import { Ref, defineComponent, ref, watch } from 'vue';

export default defineComponent({
  props: {
    profile: {
      type: Object as () => Profile,
      required: true,
    },
  },

  setup(props) {
    let error = ref<string | null>(null);
    let loading = ref<boolean>(false);
    const localProfile = ref({ ...props.profile }) as Ref<Profile>;

    watch(
      () => props.profile,
      (newProfile) => {
        localProfile.value = { ...newProfile };
      }
    );

    const handleUpdateProfile = async () => {
      try {
        error.value = null;
        loading.value = true;
        await invokeApi({
          index: 4,
          method: 'PUT',
          path: '/users/' + localProfile.value.id,
          parameters: {
            ...localProfile.value,
          },
          useQueryString: false,
          forceRefreshToken: false,
        });
        Notify.create({
          message: 'Votre profil a été mis à jour',
          color: 'positive',
        });
      } catch (err: unknown) {
        if (err instanceof AxiosError) {
          if (err.response?.status === 304) {
            Notify.create({
              message: 'Aucun changement détecté',
              color: 'warning',
            });
          } else {
            Notify.create({
              message: translateError(err as QueryError),
              color: 'negative',
            });
          }
        } else {
          Notify.create({
            message: 'Une erreur est survenue',
            color: 'negative',
          });
        }
      } finally {
        loading.value = false;
      }
    };

    return {
      error,
      loading,
      localProfile,
      handleUpdateProfile,
    };
  },
});
</script>
