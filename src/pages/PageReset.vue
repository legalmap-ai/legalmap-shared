<template>
  <div class="login">
    <form @submit.prevent="handleSubmit" v-if="!askCode">
      <h2>Mot de passe oublié</h2>
      <q-input
        dense
        outlined
        type="email"
        v-model="username"
        placeholder="Email"
        class="input"
        label="Email"
      />
      <BaseButton style="width: 100%" type="submit">Réinitialiser</BaseButton>
      <div class="have-account">
        Pas encore de compte ?
        <router-link to="/register">Créez-en un</router-link>
      </div>
    </form>
    <form v-else @submit.prevent="handleReset">
      <h2>Code de vérification</h2>
      <div class="subtitle">
        Un code de vérification vous a été envoyé par email
      </div>
      <q-input
        dense
        outlined
        type="number"
        v-model="code"
        placeholder="Code de vérification"
        class="input"
        label="Code de vérification"
      />
      <q-input
        dense
        outlined
        type="password"
        @update:model-value="validatePassword"
        :error="!!passwordError"
        :error-message="passwordError"
        autocomplete="new-password"
        v-model="password"
        placeholder="Nouveau mot de passe"
        class="input"
        label="Nouveau mot de passe"
      />
      <BaseButton
        style="width: 100%"
        type="submit"
        :disabled="!!passwordError || !password"
        >Réinitialiser</BaseButton
      >
    </form>
  </div>
</template>

<script setup lang="ts">
import BaseButton from '../components/BaseButton.vue';

import { useAuthenticator } from '@aws-amplify/ui-vue';
import '@aws-amplify/ui-vue/styles.css';

import { Amplify } from 'aws-amplify';
import { ref, toRefs } from 'vue';
import { resetPassword, confirmResetPassword } from 'aws-amplify/auth';
import { useRouter } from 'vue-router';
import { Notify } from 'quasar';
import { isValidPassword } from '../utils/accounts.util';

// import awsconfigDev from '../../backend/dev/amplifyconfiguration.json';
// import awsconfigMaster from '../../backend/master/amplifyconfiguration.json';

import awsconfigDev from '../../backend/dev/aws-exports';
import awsconfigMaster from '../../backend/master/aws-exports';

if (process.env.DEV) {
  Amplify.configure(awsconfigDev);
  console.log('Use development backend');
} else {
  Amplify.configure(awsconfigMaster);
  console.log('Use production backend');
}

defineOptions({
  name: 'PageReset',
});

const { authStatus } = toRefs(useAuthenticator());
console.log(authStatus.value);

const router = useRouter();

const username = ref('');
const code = ref('');
const password = ref('');
const askCode = ref(false);

const handleSubmit = async () => {
  try {
    const res = await resetPassword({
      username: username.value,
    });
    console.log(res);
    askCode.value = true;
  } catch (error) {
    console.error(error);
  }
};

const handleReset = async () => {
  try {
    await confirmResetPassword({
      username: username.value,
      confirmationCode: code.value,
      newPassword: password.value,
    });

    Notify.create({
      message: 'Votre mot de passe a été réinitialisé avec succès',
      color: 'positive',
      position: 'top',
    });

    router.push('/login');
  } catch (error) {
    Notify.create({
      message: 'Le code de vérification est incorrect',
      color: 'negative',
      position: 'top',
    });
  }
};

const passwordError = ref('');

const validatePassword = (text: string | number | null) => {
  passwordError.value = isValidPassword(text as string);
};
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
