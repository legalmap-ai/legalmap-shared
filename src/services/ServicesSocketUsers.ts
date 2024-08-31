// import axios from 'axios';
import { QueryError } from '../utils/api.utils';
import { getSignedHeaders } from '../utils/api.utils';
import { AWSCredentials, useAuthStore } from '../stores/store-auth';
import { w3cwebsocket as W3CWebSocket } from 'websocket';
// import * as crypto from 'crypto-js';
// import { Signer } from "aws-amplify"

const authStore = useAuthStore();

// function jsonToUrlParam(jsonObject: never) {
//   // Convertit l'objet JSON en chaîne de caractères
//   const jsonString = JSON.stringify(jsonObject);

//   // Encode la chaîne pour la rendre compatible avec une URL
//   const encodedString = encodeURIComponent(jsonString);

//   return encodedString;
// }

// function buildHeadersString(headers: Record<string, string>) {
//   let headersString = '';

//   for (const key in headers) {
//     if (headers.hasOwnProperty(key)) {
//       let value = headers[key];

//       // Si la valeur est un objet (comme pour X-Amz-Content-Sha256), nous devons le sérialiser en JSON
//       if (typeof value === 'object') {
//         debugger;
//         value = jsonToUrlParam(value);
//       }

//       // Ajouter l'en-tête sous la forme "clé: valeur"
//       headersString += `${key}: ${value}\r\n`;
//     }
//   }

//   return headersString;
// }

// function headersToQueryString(headers: Record<string, string>) {
//   return Object.keys(headers)
//     .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(headers[key]))
//     .join('&');
// }

/**
 * Fetches the groups associated with the current user.
 *
 * @returns A promise that resolves to a list of user groups.
 * @throws Will throw an error if the API request fails.
 */
export async function connect_socket_api_gateway() {
  debugger;
  const awsCredentials = (await authStore.getAWSCredentials(false, false)) as AWSCredentials;
  //const access_token:string = await authStore.getAccessToken() as string;

  const region = 'eu-west-3';
  const host = 'g7fi8sjqt9.execute-api.eu-west-3.amazonaws.com';
  const endpoint = '/dev';
  const url = `wss://${host}${endpoint}`;

  const signedElements = getSignedHeaders(
    {
      accessKeyId: awsCredentials.accessKeyId,
      secretAccessKey: awsCredentials.secretAccessKey,
      sessionToken: awsCredentials.sessionToken, //access_token//
    },
    region,
    host
  );

  // Étape 2: Créer l'URL avec les paramètres de requête signés
  const queryString = Object.entries(signedElements.urlDatas)
    .map(([key, value]) => {
      return `${key}=${value as string}`;
      //return `${encodeURIComponent(key)}=${encodeURIComponent(value as string)}`;
    })
    .join('&');

  //signedHeaders['X-Amz-Security-Token'] = awsCredentials.sessionToken;
  //const final_url = `${url}?${queryString}`;

  //const final_rel = `wss:/g7fi8sjqt9.execute-api.eu-west-3.amazonaws.com/dev?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ACCESSKEY/20200131/region/execute-api/aws4_request&X-Amz-Date=20200131T100233Z&X-Amz-Security-Token=SECURITY_TOKEN&X-Amz-SignedHeaders=host&X-Amz-Signature=SIGNATURE`
  const final_rel = `${url}?${queryString}`;

  debugger;
  // Étape 3: Connexion WebSocket
  try {
    const wsClient = new W3CWebSocket(final_rel, 'wss');

    wsClient.onerror = function (error: Error) {
      debugger;
      console.log('[client]: Connection Error ');
      console.log(error);
    };

    wsClient.onopen = function () {
      debugger;
      console.log('[client]: WebSocket Client Connected');
    };

    wsClient.onclose = function () {
      debugger;
      console.log('[client]: Client Closed');
    };

    wsClient.onmessage = function (e) {
      debugger;
      if (typeof e.data === 'string') {
        console.log("Received: '" + e.data + "'");
      }
    };

    return 'true';
  } catch (error) {
    debugger;
    console.error(
      'API call failed',
      (error as QueryError).response?.data || (error as QueryError).message || error
    );
    throw error;
  }
}
