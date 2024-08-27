import axios from 'axios';
import { useUserStore } from '../stores/StoreUser';

const userStore = useUserStore();

export interface QueryError extends Error {
  response?: {
    data?: {
      error: string;
    };
  };
}

const API_ENDPOINT =
  'https://cwy1fwkqwl.execute-api.eu-west-3.amazonaws.com/dev';

export const getUserGroups = async () => {
  try {
    const access_token = await userStore.getAccessToken();
    const response = await axios.get(`${API_ENDPOINT}/me/groups`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    return response.data.groups;
  } catch (error) {
    throw error;
  }
};
