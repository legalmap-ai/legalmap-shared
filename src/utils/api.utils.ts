import moment from 'moment';
import crypto from 'crypto-js';
import awsconfigDev from '../../backend/dev/aws-exports';
import awsconfigMaster from '../../backend/master/aws-exports';
import { AWSCredentials } from '../stores/store-auth';

export interface QueryError extends Error {
  response?: {
    data?: {
      error: string;
      message: string;
    };
  };
}

export interface SignedHeaders {
  'X-Amz-Date': string;
  Authorization: string;
  Host: string;
}

export interface SignedQueryRequest {
  method: string;
  baseURL: string;
  url: string;
  data: string | unknown;
  headers: Record<string, string>;
  signature?: crypto.lib.WordArray;
}

export interface SignedSocketQueryRequest {
  method: string;
  baseURL: string;
  url: string;
  data: string;
  headers: SignedHeaders;
  signature?: crypto.lib.WordArray;
}

/**
 * Retrieves the AWS project region based on the current environment.
 *
 * This function checks the current environment to determine whether to use the development
 * or master AWS project region. It returns the region as a string.
 *
 * @returns {string} The AWS project region (e.g., 'eu-west-3').
 */
export const getRegion = (): string => {
  let region: string = '';

  if (process.env.DEV) {
    region = awsconfigDev.aws_project_region;
  } else {
    region = awsconfigMaster.aws_project_region;
  }

  return region;
};

/**
 * Retrieves the API configuration, including the protocol, endpoint, and environment strings based on the current environment.
 *
 * This function checks the current environment to determine whether to use the development
 * or master API endpoint. It then extracts and returns an object containing the protocol,
 * the API endpoint, and the environment name.
 *
 * @returns {{ protocol: string, endpoint: string, environment: string }} An object containing the protocol
 *          (e.g., 'https'), the API endpoint (e.g., 'fzbyhtflfl.execute-api.eu-west-3.amazonaws.com'),
 *          and the environment (e.g., 'devarnaud').
 */
export const getApiConfig = (): { protocol: string; endpoint: string; environment: string } => {
  let api_endpoint = '';

  if (process.env.DEV) {
    api_endpoint = awsconfigDev.aws_cloud_logic_custom[0].endpoint;
  } else {
    api_endpoint = awsconfigMaster.aws_cloud_logic_custom[0].endpoint;
  }

  // Split the URL to extract the protocol, endpoint, and environment
  const urlParts = api_endpoint.split('/');
  const protocol = urlParts[0].replace(':', ''); // Extracts the protocol, removes the colon
  const endpoint = urlParts[2]; // Extracts the endpoint part of the URL
  const environment = urlParts[urlParts.length - 1]; // Extracts the last part as the environment

  return {
    protocol: protocol,
    endpoint: endpoint,
    environment: environment,
  };
};

/**
 * Generates a signed request for the AWS API.
 *
 * @param path - The API path that the request will target.
 * @param awsCredentials - AWS credentials including access key, secret key, and session token.
 * @param request_parameters - Parameters to be included in the request payload.
 *
 * @returns A promise that resolves to a SignedQueryRequest object containing the signed request details.
 */
export const getApiSignedTokenRequest = async (
  method: string,
  path: string,
  awsCredentials: AWSCredentials,
  request_parameters: string | unknown
): Promise<SignedQueryRequest> => {
  const canonical_uri = '/' + getApiConfig().environment + path;

  // Extract the necessary AWS credentials
  const access_key = awsCredentials?.accessKeyId;
  const secret_key = awsCredentials?.secretAccessKey;
  const service = 'execute-api';
  const host = getApiConfig().endpoint;
  const region = getRegion();
  const base = getApiConfig().protocol + '://';
  const content_type = 'application/json';

  /**
   * Generates the signature key used to sign the request.
   *
   * @param key - The secret access key for the AWS account.
   * @param dateStamp - The date stamp in yyyyMMdd format.
   * @param regionName - The AWS region.
   * @param serviceName - The service name, e.g., 'execute-api'.
   *
   * @returns The generated signing key as a crypto.lib.WordArray.
   */
  function getSignatureKey(
    key: string | undefined,
    dateStamp: string | crypto.lib.WordArray,
    regionName: string | crypto.lib.WordArray,
    serviceName: string | crypto.lib.WordArray
  ) {
    const kDate = crypto.HmacSHA256(dateStamp, 'AWS4' + key);
    const kRegion = crypto.HmacSHA256(regionName, kDate);
    const kService = crypto.HmacSHA256(serviceName, kRegion);
    const kSigning = crypto.HmacSHA256('aws4_request', kService);
    return kSigning;
  }

  // Create timestamps required for the request
  const amz_date = moment().utc().format('yyyyMMDDTHHmmss\\Z');
  const date_stamp = moment().utc().format('yyyyMMDD');

  // Step 3: Create the canonical query string (empty in this case)
  let canonical_querystring;
  // Step 6: Create the payload hash using the SHA256 algorithm

  let payload_hash;
  if (method === 'GET') {
    payload_hash = crypto.SHA256('');

    // Convertir les paramètres en objet puis les trier par ordre alphabétique
    const params = new URLSearchParams(request_parameters as string);
    const sorted_params = new URLSearchParams([...params.entries()].sort());

    // Reconstruire la chaîne de requête triée
    canonical_querystring = sorted_params.toString();
  } else {
    if (request_parameters != '') {
      payload_hash = crypto.SHA256(JSON.stringify(request_parameters));
    } else {
      payload_hash = crypto.SHA256(request_parameters as string);
    }
    canonical_querystring = ''; // Souvent vide pour les autres méthodes
  }

  // Step 4: Create the canonical headers, including the payload hash and timestamps
  const canonical_headers =
    'host:' +
    host +
    '\n' +
    'x-amz-content-sha256:' +
    payload_hash +
    '\n' +
    'x-amz-date:' +
    amz_date +
    '\n';

  // Step 5: Create the list of signed headers, which must match the canonical headers
  const signed_headers = 'host;x-amz-content-sha256;x-amz-date';

  // Step 7: Combine elements to create the canonical request
  const canonical_request =
    method +
    '\n' +
    canonical_uri +
    '\n' +
    canonical_querystring +
    '\n' +
    canonical_headers +
    '\n' +
    signed_headers +
    '\n' +
    payload_hash;

  console.log('');
  console.log('canonical_request');
  console.log(canonical_request);

  // Step 2: Create the string to sign, which includes the algorithm, timestamp, credential scope, and hashed canonical request
  const algorithm = 'AWS4-HMAC-SHA256';
  const credential_scope = date_stamp + '/' + region + '/' + service + '/' + 'aws4_request';
  const string_to_sign =
    algorithm + '\n' + amz_date + '\n' + credential_scope + '\n' + crypto.SHA256(canonical_request);

  // Step 3: Calculate the signature using the signing key and the string to sign
  const signing_key = getSignatureKey(secret_key, date_stamp, region, service);

  console.log('');
  console.log('string_to_sign');
  console.log(string_to_sign);

  // Sign the string_to_sign using the signing key
  const signature = crypto.HmacSHA256(string_to_sign, signing_key);

  // Step 4: Add signing information to the request headers, including the authorization header
  const authorization_header =
    algorithm +
    ' ' +
    'Credential=' +
    access_key +
    '/' +
    credential_scope +
    ', ' +
    'SignedHeaders=' +
    signed_headers +
    ', ' +
    'Signature=' +
    signature +
    ', ';

  // Prepare the final headers for the request, including security token if available
  const headers = {
    'X-Amz-Content-Sha256': payload_hash as unknown as string,
    'X-Amz-Date': amz_date,
    'x-amz-security-token': awsCredentials?.sessionToken ?? '',
    Authorization: authorization_header,
    'Content-Type': content_type,
    //'X-Amz-Target': amz_target, // Uncomment this if targeting a specific API operation
  };

  // Return the signed request object with all necessary information

  let url;
  if (method === 'GET') {
    url = canonical_uri + request_parameters;
  } else {
    url = canonical_uri;
  }

  return {
    method: method,
    baseURL: base + host,
    url: url,
    data: request_parameters,
    headers: headers,
  };
};
