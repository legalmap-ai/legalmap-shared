import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { Amplify } from 'aws-amplify';
//https://aws-amplify.github.io/amplify-js/api/functions/aws_amplify.auth.fetchAuthSession.html
import {
  fetchAuthSession,
  GetCurrentUserOutput,
  getCurrentUser,
  signIn,
  signOut,
  updatePassword,
} from '@aws-amplify/auth';

import { Notify } from 'quasar';
import { useRouter } from 'vue-router';

// Environment configuration imports
import awsconfigDev from '../../backend/dev/aws-exports';
import awsconfigMaster from '../../backend/master/aws-exports';

export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string | undefined;
  expiration: Date | undefined;
}

// Configure Amplify based on the environment
if (process.env.DEV) {
  Amplify.configure(awsconfigDev);
  console.log('Using development backend');
} else {
  Amplify.configure(awsconfigMaster);
  console.log('Using production backend');
}

// Define Pinia store for user management
export const useAuthStore = defineStore('user', () => {
  const user = ref<null | GetCurrentUserOutput>(null); // Stores the current user
  const authStatus = ref<'authenticated' | 'unauthenticated' | 'loading'>('unauthenticated'); // Authentication status
  const router = useRouter(); // Router for navigation

  /**
   * Retrieves the AWS credentials from the current session.
   *
   * @param {boolean} [forceRefresh=false] - Optional. If set to true, forces a refresh of the authentication session.
   * @param {boolean} [encoded=false] - Optional. If set to true, encodes the AWS credentials using `encodeURIComponent`.
   *
   * @returns {Promise<AWSCredentials | null>} A promise that resolves with the AWS credentials if successful,
   *                                           or null if the credentials are not available.
   *                                           If an error occurs during the process, the promise is rejected with the error.
   *
   * The returned object has the following structure:
   *   - accessKeyId: The AWS Access Key ID.
   *   - secretAccessKey: The AWS Secret Access Key.
   *   - sessionToken: The session token associated with the credentials.
   *   - expiration: The expiration time of the credentials.
   *
   * Example usage:
   * getAWSCredentials().then(credentials => {
   *   if (credentials) {
   *     console.log('AWS Credentials:', credentials);
   *   } else {
   *     console.log('No AWS credentials available.');
   *   }
   * }).catch(error => {
   *   console.error('Error retrieving AWS credentials:', error);
   * });
   */
  const getAWSCredentials = async (forceRefresh = false, encoded = false) => {
    try {
      const session = await fetchAuthSession({ forceRefresh: forceRefresh }); // Fetches the authentication session
      const credentials = session?.credentials;
      if (credentials) {
        if (encoded) {
          return {
            accessKeyId: encodeURIComponent(credentials.accessKeyId),
            secretAccessKey: encodeURIComponent(credentials.secretAccessKey),
            sessionToken: credentials.sessionToken,
            expiration: credentials.expiration,
          };
        } else {
          return {
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
            sessionToken: credentials.sessionToken,
            expiration: credentials.expiration,
          };
        }
      } else {
        return null;
      }
    } catch (error) {
      throw error;
    }
  };

  /**
   * Retrieves the access token from the current session.
   * @param {boolean} [forceRefresh=false] - Optional. If set to true, forces a refresh of the authentication session.
   * @returns {Promise<string | null>} A promise that resolves with the access token or null in case of error
   */
  const getAccessToken = async (forceRefresh = false): Promise<string | null> => {
    try {
      const session = await fetchAuthSession({ forceRefresh: forceRefresh }); // Fetches the authentication session
      return session?.tokens?.accessToken?.toString() || null;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  /**
   * Retrieves the  client id from the current session.
   * @returns {Promise<string | null>} A promise that resolves with the client id or null in case of error
   */
  const getClientId = async (): Promise<string | null> => {
    try {
      const session = await fetchAuthSession();
      return session?.tokens?.accessToken.payload.client_id as string; //legalmap todo : signInDetails is deprecated
    } catch (error) {
      throw error;
    }
  };

  /**
   * Retrieves the user login id from the current session.
   * @param {boolean} [forceRefresh=false] - Optional. If set to true, forces a refresh of the authentication session.
   * @returns {Promise<string | null>} A promise that resolves with the access token or null in case of error
   */
  const getLoginId = async (forceRefresh = false): Promise<string | null> => {
    try {
      const session = await fetchAuthSession({ forceRefresh: forceRefresh }); // Fetches the authentication session
      return session?.tokens?.signInDetails?.loginId || null; //legalmap todo : signInDetails is deprecated
    } catch (error) {
      throw error;
    }
  };

  /**
   * Retrieves the user login authentication time from the current session.
   * @returns {Promise<string | null>} A promise that resolves with the access token or null in case of error
   */
  const getAuthTime = async (): Promise<number | null> => {
    try {
      const session = await fetchAuthSession(); // Fetches the authentication session
      return (session?.tokens?.accessToken.payload.auth_time as number) || null;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Retrieves the user login authentication date (french format) from the current session.
   * @returns {Promise<string | null>} A promise that resolves with the formatted date string or null in case of error
   */
  const getAuthTimeDate = async (): Promise<string | null> => {
    try {
      const session = await fetchAuthSession(); // Fetches the authentication session
      const authTime = session?.tokens?.accessToken.payload.auth_time as number;

      if (authTime) {
        // Convert the timestamp to a Date object
        const date = new Date(authTime * 1000); // Assuming auth_time is in seconds, convert to milliseconds

        // Format the date in French
        const formatter = new Intl.DateTimeFormat('fr-FR', {
          dateStyle: 'full', // 'full' can be replaced with 'short', 'medium', or 'long' based on your needs
          timeStyle: 'short', // 'short' for short time format (HH:mm), 'medium' for longer time format
        });

        return formatter.format(date);
      } else {
        return null;
      }
    } catch (error) {
      throw error;
    }
  };

  const getUserId = async (): Promise<string> => {
    const session = await fetchAuthSession();
    return session.userSub || '';
  };

  /**
   * Retrieves the user cognito groups from the current session.
   * @param {boolean} [forceRefresh=false] - Optional. If set to true, forces a refresh of the authentication session.
   * @returns {Promise<string | null>} A promise that resolves with the access token or null in case of error
   */
  const getGroups = async (forceRefresh = false): Promise<[string] | []> => {
    try {
      const session = await fetchAuthSession({ forceRefresh: forceRefresh }); // Fetches the authentication session
      return (session?.tokens?.accessToken.payload['cognito:groups'] as [string]) || [];
    } catch (error) {
      throw error;
    }
  };

  /**
   * Authenticates the user with the provided credentials.
   * @param {string} username - The username
   * @param {string} password - The password
   */
  const login = async (username: string, password: string) => {
    try {
      await signIn({
        username,
        password,
      });

      console.log(Amplify);

      setUser();

      authStatus.value = 'authenticated';
      Notify.create({
        message: 'You are logged in',
        color: 'positive',
        position: 'top',
      });
      router.push('/profile');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      let message = '';

      // Handle login errors
      switch (error.message) {
        case 'Incorrect username or password.':
          message = 'Incorrect username or password';
          break;
        case 'Password attempts exceeded':
          message = 'Password attempts exceeded';
          break;
        default:
          message = error.message;
      }

      Notify.create({
        message: message,
        color: 'negative',
        position: 'top',
      });
    }
  };

  /**
   * Logs out the current user.
   */
  const logOut = async () => {
    try {
      await signOut(); // Signs out the user
      resetUser();
      authStatus.value = 'unauthenticated';
      Notify.create({
        message: 'You are logged out',
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

  const resetPasswordUser = async (oldPassword: string, newPassword: string) => {
    await updatePassword({ oldPassword, newPassword });
    Notify.create({
      message: 'Votre mot de passe a été modifié',
      color: 'positive',
      position: 'top',
    });
    logOut();
  };

  /**
   * set the current user from amplify current user.
   * @returns {Promise<any>} A promise that resolves with the current user
   */
  const setUser = async (): Promise<GetCurrentUserOutput> => {
    try {
      const currentUser = (await getCurrentUser()) as GetCurrentUserOutput;
      user.value = currentUser;
      authStatus.value = 'authenticated';
      return currentUser;
    } catch (error) {
      resetUser();
      throw error;
    }
  };

  /**
   * Rest the user store value
   */
  const resetUser = async () => {
    try {
      user.value = null;
      authStatus.value = 'unauthenticated';
    } catch (error) {
      throw error;
    }
  };

  const checkAuthStatus = async (): Promise<boolean> => {
    try {
      const session = await fetchAuthSession();
      if (session.tokens?.accessToken) {
        await setUser();
        return true;
      } else {
        resetUser();
        return false;
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      resetUser();
      return false;
    }
  };

  const redirectIfNotLoggedIn = async () => {
    authStatus.value = 'loading';
    const isLoggedIn = await checkAuthStatus();
    if (!isLoggedIn) {
      router.push('/login');
    }
  };

  /**
   * Checks if the user is authenticated.
   * @returns {ComputedRef<boolean>} Computed boolean indicating if the user is authenticated
   */
  const isAuthenticated = computed(() => authStatus.value === 'authenticated');

  return {
    user,
    isAuthenticated,
    login,
    logOut,
    setUser,
    resetUser,
    getGroups,
    getClientId,
    getAccessToken,
    getAWSCredentials,
    getUserId,
    getLoginId,
    getAuthTime,
    getAuthTimeDate,
    redirectIfNotLoggedIn,
    checkAuthStatus,
    resetPasswordUser,
  };
});
