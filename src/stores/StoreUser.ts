import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { Amplify } from 'aws-amplify';
import { GetCurrentUserOutput } from '@aws-amplify/auth';
import { fetchAuthSession, getCurrentUser, signIn, signOut } from '@aws-amplify/auth';
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
export const useUserStore = defineStore('user', () => {
  const user = ref<null | GetCurrentUserOutput>(null); // Stores the current user
  const authStatus = ref<'authenticated' | 'unauthenticated'>('unauthenticated'); // Authentication status
  const router = useRouter(); // Router for navigation

  /**
   * Retrieves the AWS credentials from the current session.
   * @returns {Promise<AWSCredentials | null>} A promise that resolves with the AWS credentials or null in case of error
   */
  const getAWSCredentials = async (encoded = false) => {
    try {
      const session = await fetchAuthSession(); // Fetches the authentication session
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
   * @returns {Promise<string | null>} A promise that resolves with the access token or null in case of error
   */
  const getAccessToken = async (): Promise<string | null> => {
    try {
      const session = await fetchAuthSession(); // Fetches the authentication session
      return session?.tokens?.accessToken?.toString() || null;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Retrieves the user login id from the current session.
   * @returns {Promise<string | null>} A promise that resolves with the access token or null in case of error
   */
  const getLoginId = async (): Promise<string | null> => {
    try {
      const session = await fetchAuthSession(); // Fetches the authentication session
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

  /**
   * Retrieves the user cognito groups from the current session.
   * @returns {Promise<string | null>} A promise that resolves with the access token or null in case of error
   */
  const getGroups = async (): Promise<[string] | []> => {
    try {
      const session = await fetchAuthSession(); // Fetches the authentication session
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

  /**
   * set the current user from amplify current user.
   * @returns {Promise<any>} A promise that resolves with the current user
   */
  const setUser = async (): Promise<GetCurrentUserOutput> => {
    try {
      const currentUser = (await getCurrentUser()) as GetCurrentUserOutput; // Retrieves the current user
      user.value = currentUser;
      authStatus.value = 'authenticated';
      return currentUser;
    } catch (error) {
      authStatus.value = 'unauthenticated';
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
    getAccessToken,
    getAWSCredentials,
    getLoginId,
    getAuthTime,
    getAuthTimeDate,
  };
});
