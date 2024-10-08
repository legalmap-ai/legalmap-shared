<template>
  <div class="login">
    <form @submit.prevent="handleSubmit" v-if="!askCode">
      <h2>S'inscrire</h2>
      <q-input
        class="q-mb-md"
        outlined
        type="text"
        v-model="given_name"
        placeholder="Prénom"
        dense
        label="Prénom"
      />
      <q-input
        class="q-mb-md"
        outlined
        type="text"
        v-model="family_name"
        placeholder="Nom"
        dense
        label="Nom"
      />

      <q-input
        class="q-mb-md input--email"
        outlined
        type="email"
        v-model="username"
        placeholder="Email"
        dense
        label="Email"
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
        placeholder="Mot de passe"
        label="Mot de passe"
      />
      <q-input
        dense
        outlined
        type="password"
        @update:model-value="validatePassword2"
        :error="!!password2Error"
        :error-message="password2Error"
        autocomplete="new-password"
        v-model="password2"
        placeholder="Confirmer le mot de passe"
        label="Confirmer le mot de passe"
      />

      <BaseButton
        style="width: 100%"
        type="submit"
        :disabled="!!passwordError || !!password2Error || !password || !password2"
      >
        <q-spinner-oval v-if="loading" color="white" size="1em" />
        {{ loading ? 'Chargement...' : "S'inscrire" }}
      </BaseButton>
      <div class="have-account">
        Déjà inscrit ?
        <router-link to="/login">Se connecter</router-link>
      </div>
    </form>
    <form v-else @submit.prevent="handleValidate">
      <h2>Confirmer votre email</h2>
      <div class="subtitle">Un code de vérification vous a été envoyé par email</div>
      <q-input
        dense
        outlined
        type="number"
        v-model="code"
        placeholder="Code de vérification"
        class="q-pb-sm q-pt-md"
        label="Code de vérification"
      />

      <BaseButton style="width: 100%" type="submit" :disabled="!!passwordError || !password">
        <q-spinner-oval v-if="loading" color="white" size="1em" />
        {{ loading ? 'Chargement...' : 'Valider' }}
      </BaseButton>
      <a class="forgot q-pb-md" @click="handleAskCode">Renvoyer le code</a>
    </form>
  </div>
</template>

<script setup lang="ts">
import BaseButton from '../components/BaseButton.vue';

import { ref } from 'vue';
import { signUp, confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';

import { useRouter } from 'vue-router';
import { Notify } from 'quasar';

import { isValidPassword } from '../utils/accounts.util';
import { Amplify } from 'aws-amplify';

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

// defineOptions({
//   name: 'PageRegister',
// });

const router = useRouter();

const username = ref('abedoyere@gmail.com');
const given_name = ref('Arnaud');
const family_name = ref('de La Bédoyère');

const code = ref('');
const password = ref('Arnaud_1234');
const password2 = ref('Arnaud_1234');
const askCode = ref(false);

const loading = ref(false);

const handleSubmit = async () => {
  try {
    loading.value = true;
    //https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_SignUp.html
    const res = await signUp({
      username: username.value,
      password: password.value,
      options: {
        userAttributes: {
          given_name: given_name.value,
          family_name: family_name.value,
        },
      },
    });

    Notify.create({
      message: 'Un code de vérification vous a été envoyé par email.',
      color: 'positive',
      position: 'top',
    });
    console.log(res);

    askCode.value = true;
  } catch (error) {
    Notify.create({
      message: 'Une erreur est survenue.',
      color: 'negative',
      position: 'top',
    });
  } finally {
    loading.value = false;
  }
};

const handleValidate = async () => {
  try {
    loading.value = true;
    await confirmSignUp({
      username: username.value,
      confirmationCode: code.value,
    });

    Notify.create({
      message: 'Votre compte a été créé avec succès.',
      color: 'positive',
      position: 'top',
    });

    router.push('/login');
  } catch (error) {
    Notify.create({
      message: 'Le code de vérification est incorrect.',
      color: 'negative',
      position: 'top',
    });
  } finally {
    loading.value = false;
  }
};

const passwordError = ref('');

const validatePassword = (text: string | number | null) => {
  passwordError.value = isValidPassword(text as string);
};

const password2Error = ref('');

const validatePassword2 = (text: string | number | null) => {
  const passwordValue = text;

  if (passwordValue !== password.value) {
    password2Error.value = 'Les mots de passe ne correspondent pas.';
  } else {
    password2Error.value = '';
  }
};

const handleAskCode = () => {
  resendSignUpCode({ username: username.value });
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
