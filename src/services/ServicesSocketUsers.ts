// import axios from 'axios';
import { AWSCredentials, useAuthStore } from '../stores/store-auth';
import { QueryError } from '../utils/api.utils';
import { RequestSigner, Request, Credentials } from '../utils/aws-signer.utils';

// import { getSignedHeaders } from '../utils/api.utils';
// import { w3cwebsocket as W3CWebSocket } from 'websocket';
// import * as crypto from 'crypto-js';
// import { Signer } from "aws-amplify"

const authStore = useAuthStore();

export async function connect_socket_api_gateway() {
  const awsCredentials = (await authStore.getAWSCredentials(false, false)) as AWSCredentials;

  // const region = 'eu-west-3';
  // const host = 'g7fi8sjqt9.execute-api.eu-west-3.amazonaws.com';
  // const endpoint = '/dev';
  // const url = `wss://${host}${endpoint}`;

  try {
    // Définir la requête
    const request: Request = {
      //method: 'GET',
      host: 'g7fi8sjqt9.execute-api.eu-west-3.amazonaws.com',
      path: '/dev',
      signQuery: true,
      // headers: {
      //   'Content-Type': 'application/json',
      // },
      service: 'execute-api',
      region: 'eu-west-3',
    };

    // Définir les informations d'identification
    const credentials: Credentials = {
      accessKeyId: awsCredentials.accessKeyId,
      secretAccessKey: awsCredentials.secretAccessKey,
      sessionToken: awsCredentials.sessionToken,
    };

    const requestSigner = new RequestSigner(request, credentials);
    const signedRequest = requestSigner.sign();

    console.log('CANONICAL STRING : ');
    console.log(requestSigner.canonicalString());
    console.log('');
    console.log('STRING TO SIGN');
    console.log(requestSigner.stringToSign());

    console.log('wss://g7fi8sjqt9.execute-api.eu-west-3.amazonaws.com/dev/');
    console.log('wss://' + signedRequest.host + signedRequest.path);

    const socket = new WebSocket('wss://' + signedRequest.host + signedRequest.path);
    //const socket = new WebSocket('wss://g7fi8sjqt9.execute-api.eu-west-3.amazonaws.com/dev/');
    socket.onopen = function (this: WebSocket, ev: Event) {
      debugger;
      console.log('CONNECTED');
      console.log(ev);
    };
    socket.onerror = function (this: WebSocket, ev: Event) {
      debugger;
      console.log('ERROR ');
      console.log(ev);
    };
    socket.onclose = function (this: WebSocket, ev: CloseEvent) {
      console.error('WebSocket Close:', ev);
      if (ev.code !== 1000) {
        console.error('WebSocket closed with an error:', ev.code, ev.reason);
      }
    };
    return 'true';
  } catch (error) {
    console.error(
      'API call failed',
      (error as QueryError).response?.data || (error as QueryError).message || error
    );
    throw error;
  }
}
