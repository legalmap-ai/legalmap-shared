import axios from 'axios';
import { QueryError } from '../utils/api.utils';
import { getApiEnpdpoint, getApiSignedTokenRequest } from '../utils/api.utils';
import { AWSCredentials, useAuthStore } from '../stores/store-auth';
import { Profile } from 'src/types/profile';

const authStore = useAuthStore();

/**
 * Fetches the groups associated with the current user.
 *
 * @returns A promise that resolves to a list of user groups.
 * @throws Will throw an error if the API request fails.
 */
export async function getUserGroups() {
  // Retrieve AWS credentials from the user store, ensuring they're up-to-date
  //Added support of force refresh token in case user have been removed from a group and update auth access
  const awsCredentials = (await authStore.getAWSCredentials(true, false)) as AWSCredentials;

  // Generate a signed API request to the endpoint '/dev/me/groups' using the AWS credentials
  const signedQyery = await getApiSignedTokenRequest('/me/groups', awsCredentials, '', ''); // Example parameter: `{"date":"today","content":"hello"}`

  try {
    // Make an API call using the signed request details
    const response = await axios({
      method: signedQyery.method,
      baseURL: signedQyery.baseURL,
      url: signedQyery.url,
      data: signedQyery.data,
      headers: signedQyery.headers,
    });

    // Return the list of groups from the API response
    return response.data.groups;
  } catch (error) {
    // Log an error message if the API call fails and rethrow the error
    console.error(
      'API call failed',
      (error as QueryError).response?.data || (error as QueryError).message || error
    );
    throw error;
  }
}

/**
 * Generates some data (e.g., a report or content) by calling a specific API endpoint.
 *
 * @returns A promise that resolves to the generated groups data.
 * @throws Will throw an error if the API request fails.
 */
export const generate = async () => {
  try {
    // Retrieve the access token from the user store
    const access_token = await authStore.getAccessToken();

    // Make a GET request to the specific API endpoint, using the access token for authorization
    const response = await axios.get(`${getApiEnpdpoint()}/todo_here_generate_path`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    // Return the generated groups data from the API response
    return response.data.groups;
  } catch (error) {
    // Rethrow the error if the API request fails
    throw error;
  }
};

export const updateProfile = async (profile: Profile) => {
  // Retrieve AWS credentials from the user store, ensuring they're up-to-date
  //Added support of force refresh token in case user have been removed from a group and update auth access
  const awsCredentials = (await authStore.getAWSCredentials(true, false)) as AWSCredentials;
  const parameters = '';
  // Generate a signed API request to the endpoint '/dev/me/groups' using the AWS credentials
  const signedQyery = await getApiSignedTokenRequest(
    '/me/profile',
    awsCredentials,
    parameters,
    JSON.stringify(profile),
    'PUT'
  ); // Example parameter: `{"date":"today","content":"hello"}`
  try {
    // Make an API call using the signed request details
    const response = await axios({
      method: signedQyery.method,
      baseURL: signedQyery.baseURL,
      url: signedQyery.url,
      data: profile,
      headers: signedQyery.headers,
    });

    // Return the list of groups from the API response
    return response.data.groups;
  } catch (error) {
    // Log an error message if the API call fails and rethrow the error
    console.error(
      'API call failed',
      (error as QueryError).response?.data || (error as QueryError).message || error
    );
    throw error;
  }
};
