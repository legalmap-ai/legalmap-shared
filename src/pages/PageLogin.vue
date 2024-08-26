<template>
  <div class="login">
    <form @submit.prevent="handleSubmit">
      <h2>Se connecter</h2>
      <q-input
        dense
        outlined
        type="text"
        v-model="username"
        placeholder="Email"
        class="input"
        label="Email"
      />
      <q-input
        dense
        outlined
        type="password"
        v-model="password"
        placeholder="Mot de passe"
        class="input"
        label="Mot de passe"
      />
      <BaseButton style="width: 100%" type="submit">Se connecter</BaseButton>
      <router-link to="/reset" class="forgot">
        Mot de passe oublié ?
      </router-link>
      <div class="have-account">
        Pas encore de compte ?
        <router-link to="/register">Créez-en un</router-link>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useUserStore } from '../stores/StoreUser';
import { useRouter } from 'vue-router';
import { Notify } from 'quasar';
import BaseButton from '../components/BaseButton.vue';
const router = useRouter();
const userStore = useUserStore();
const username = ref('');
const password = ref('');
const isAuthenticated = userStore.isAuthenticated;

const handleSubmit = async () => {
  await userStore.login(username.value, password.value);
};

if (isAuthenticated) {
  router.push('/profile');
  Notify.create({
    message: 'Vous êtes déjà connecté',
    color: 'positive',
    position: 'top',
  });
}
</script>

<style lang="scss" scoped>
.login {
  max-width: 400px;
  width: 90%;
  margin: auto;
  padding-top: 60px;
  padding-bottom: 20px;
  padding-top: 20vh;
  padding-bottom: 20vh;

  h2 {
    font-size: 16px;
    line-height: 24px;
    font-weight: 600;
    color: $grey1;
    padding-bottom: 20px;
    text-align: center;
  }

  .input {
    margin-bottom: 10px;
  }

  .forgot {
    text-align: center;
    display: block;
    margin-top: 20px;
    color: #9fa8b0;
    text-decoration: none;
    font-size: 10px;
    cursor: pointer;

    &:hover {
      color: #505962;
    }
  }

  .have-account {
    text-align: center;
    margin-top: 20px;
    color: $grey1;
    font-size: 14px;

    a {
      color: $grey1;
      font-weight: 500;
      text-decoration: underline;
      margin-left: 5px;
    }
  }
}
</style>
