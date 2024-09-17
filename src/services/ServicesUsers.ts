import axios from 'axios';
import { getApiConfig, QueryError } from '../utils/api.utils';
import { getApiSignedTokenRequest } from '../utils/api.utils';
import { AWSCredentials, useAuthStore } from '../stores/store-auth';
import { showLoader, hideLoader } from '../utils/loader.utils';

export interface QueryTest {
  index: number;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'error';
  path: string;
  parameters: string | { [key: string]: unknown };
  useQueryString: boolean;
  forceRefreshToken: boolean;
}
const authStore = useAuthStore();

/**
 * Invokes an API request with the specified query details.
 *
 * @param {QueryTest} selected_query - The query details to be used for the API request, including method, path, and parameters.
 * @returns {Promise<any>} A promise that resolves to the API response data, or the full response object if no data is present.
 * @throws Will throw an error if the API request fails, with the error details logged to the console.
 */
export async function invokeApi(selected_query: QueryTest) {
  showLoader('Récupération et traitement du PDF');
  const awsCredentials = (await authStore.getAWSCredentials(
    selected_query.forceRefreshToken,
    false
  )) as AWSCredentials;
  const signedQuery = await getApiSignedTokenRequest(
    selected_query.method,
    '/' + getApiConfig().environment + selected_query.path,
    awsCredentials,
    selected_query.parameters,
    selected_query.useQueryString
  );

  try {
    let response;
    if (selected_query.useQueryString == true) {
      response = await axios({
        method: signedQuery.method,
        baseURL: signedQuery.baseURL,
        url: signedQuery.url,
        //data: signedQuery.data, //We don't need to send data if useQueryString is true
        //headers: signedQuery.headers, //We don't need to send headers if useQueryString is true
      });
    } else {
      response = await axios({
        method: signedQuery.method,
        baseURL: signedQuery.baseURL,
        url: signedQuery.url,
        data: signedQuery.data,
        headers: signedQuery.headers,
      });
    }
    hideLoader();
    return response.data ? response.data : response;
  } catch (error) {
    hideLoader();
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
    const response = await axios.get('https...:////todo_here_generate_path', {
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
