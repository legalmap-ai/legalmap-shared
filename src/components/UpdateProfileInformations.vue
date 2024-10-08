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
              <q-input
                disable
                color="black"
                dense
                type="email"
                v-model="user.email"
                label="Email Address"
              />
            </q-item-section>
          </q-item>
          <q-item class="col-lg-6 col-md-6 col-sm-12 col-xs-12">
            <q-item-section>
              <q-input
                color="black"
                type="text"
                dense
                v-model="user.given_name"
                label="First Name"
              />
            </q-item-section>
          </q-item>
          <q-item class="col-lg-6 col-md-6 col-sm-12 col-xs-12">
            <q-item-section>
              <q-input
                color="black"
                type="text"
                dense
                v-model="user.family_name"
                label="Last Name"
              />
            </q-item-section>
          </q-item>
        </q-list>

        <div v-if="error" class="text-negative">{{ error }}</div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn class="bg-info text-white" @click="handleUpdateProfile" :disabled="loading">
          {{ loading ? 'Chargement...' : 'Mettre à jour' }}
        </q-btn>
        <q-btn class="bg-negative text-white" @click="handleDeleteProfile" :disabled="loading">
          {{ loading ? 'Chargement...' : 'Supprimer mon compte' }}
        </q-btn>
      </q-card-actions>
    </q-card>
  </div>
</template>

<script lang="ts">
import { AxiosError } from 'axios';
import { Dialog, Notify } from 'quasar';
import { invokeApi } from '../services/ServicesUsers';
import { Profile } from '../types/profile';
import { QueryError } from '../utils/api.utils';
import { translateError } from '../utils/errors.utils';
import { defineComponent, onMounted, ref } from 'vue';
import { useAuthStore } from '../stores/store-auth';

interface User {
  email: string;
  given_name: string;
  family_name: string;
}

export default defineComponent({
  props: {
    profile: {
      type: Object as () => Profile,
      required: true,
    },
  },

  setup() {
    let error = ref<string | null>(null);
    let loading = ref<boolean>(false);
    const authStore = useAuthStore();
    const user = ref<User>({
      email: '',
      given_name: '',
      family_name: '',
    });

    const handleUpdateProfile = async () => {
      try {
        error.value = null;
        loading.value = true;
        await invokeApi({
          index: 4,
          method: 'PUT',
          path: '/users/me',
          parameters: {
            ...user.value,
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

    const handleDeleteProfile = async () => {
      Dialog.create({
        title: 'Supprimer mon compte',
        message: 'Êtes-vous sûr de vouloir supprimer votre compte ?',
        persistent: true,
        ok: {
          label: 'Oui',
          color: 'negative',
        },
        cancel: {
          label: 'Non',
          color: 'info',
        },
      }).onOk(async () => {
        try {
          error.value = null;
          loading.value = true;
          await invokeApi({
            index: 4,
            method: 'DELETE',
            path: '/users/me',
            parameters: undefined,
            useQueryString: false,
            forceRefreshToken: true,
          });
          Notify.create({
            message: 'Votre profil a été supprimé',
            color: 'positive',
          });

          authStore.logOut();
        } catch (err: unknown) {
          if (err instanceof AxiosError) {
            Notify.create({
              message: translateError(err as QueryError),
              color: 'negative',
            });
          } else {
            Notify.create({
              message: 'Une erreur est survenue',
              color: 'negative',
            });
          }
        } finally {
          loading.value = false;
        }
      });
    };

    const loadUser = async () => {
      const response = await invokeApi({
        index: 4,
        method: 'GET',
        path: '/users/me',
        parameters: {},
        useQueryString: false,
        forceRefreshToken: false,
      });

      user.value = {
        email: response.data.email,
        given_name: response.data.given_name,
        family_name: response.data.family_name,
      };
    };

    onMounted(async () => {
      loadUser();
    });

    return {
      error,
      loading,
      handleUpdateProfile,
      handleDeleteProfile,
      user,
    };
  },
});
</script>
