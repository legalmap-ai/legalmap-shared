import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { Amplify } from 'aws-amplify';
import { getCurrentUser, signIn, signOut } from 'aws-amplify/auth';

// import awsconfigDev from '../../backend/dev/amplifyconfiguration.json';
// import awsconfigMaster from '../../backend/master/amplifyconfiguration.json';
import awsconfigDev from '../../backend/dev/aws-exports';
import awsconfigMaster from '../../backend/master/aws-exports';

import { Notify } from 'quasar';
import { useRouter } from 'vue-router';

if (process.env.DEV) {
  Amplify.configure(awsconfigDev);
  console.log('Use development backend');
} else {
  Amplify.configure(awsconfigMaster);
  console.log('Use production backend');
}

export const useUserStore = defineStore('user', () => {
  const user = ref(null);
  const authStatus = ref('unauthenticated');
  const router = useRouter();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setUser = (newUser: any) => {
    user.value = newUser;
  };

  const login = async (username: string, password: string) => {
    try {
      const user = await signIn({ username, password });
      setUser(user);
      authStatus.value = 'authenticated';
      Notify.create({
        message: 'Vous êtes connecté',
        color: 'positive',
        position: 'top',
      });
      router.push('/profile');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      let message = '';

      if (error.message === 'Incorrect username or password.') {
        message = "Nom d'utilisateur ou mot de passe incorrect";
      } else if (error.message === 'Password attempts exceeded') {
        message = 'Tentatives de connexion dépassées';
      } else {
        message = error.message;
      }

      Notify.create({
        message: message,
        color: 'negative',
        position: 'top',
      });
    }
  };

  const logOut = async () => {
    try {
      debugger;
      const res = await signOut();
      console.log(res);
      setUser(null);
      authStatus.value = 'unauthenticated';
      Notify.create({
        message: 'Vous êtes déconnecté',
        color: 'positive',
        position: 'top',
      });
      router.push('/login');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      Notify.create({
        message: error.message,
        color: 'negative',
        position: 'top',
      });
    }
  };

  const loadUser = () => {
    return new Promise(async (resolve, reject) => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        authStatus.value = 'authenticated';
        resolve(currentUser);
      } catch (error) {
        authStatus.value = 'unauthenticated';
        reject(error);
      }
    });
  };

  const isAuthenticated = computed(() => authStatus.value === 'authenticated');

  return {
    user,
    isAuthenticated,
    login,
    logOut,
    loadUser,
  };
});
