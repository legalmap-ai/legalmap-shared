import moment from 'moment';
import crypto from 'crypto-js';
import { AWSCredentials } from '../stores/store-auth';

const API_BASE = 'https://';
// const API_SOCKET_BASE = 'wss://';

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
  data: string;
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
 * Retrieves the API environment string based on the environment.
 *
 * @returns The API environment string as a string to complete a path. Depending on the environment,
 *          it returns the development dev string or the master string.
 */
const getApiEnv = () => {
  let api_env = '';
  if (process.env.DEV) {
    api_env = '/dev';
  } else {
    api_env = '/master';
  }
  return api_env;
};

/**
 * Retrieves the API endpoint based on the environment.
 *
 * @returns The API endpoint URL as a string. Depending on the environment,
 *          it returns the development endpoint or the master endpoint.
 */
export const getApiEnpdpoints = () => {
  let api_endpoint_url = '';
  let api_socket_connection_url = '';
  let api_web_socket_url = '';

  if (process.env.DEV) {
    api_endpoint_url = '6zkggqg3qg.execute-api.eu-west-3.amazonaws.com';
    api_socket_connection_url = 'g7fi8sjqt9.execute-api.eu-west-3.amazonaws.com';
    api_web_socket_url = 'g7fi8sjqt9.execute-api.eu-west-3.amazonaws.com';

    console.log('Use development API endpoint');
  } else {
    api_endpoint_url = 'icf8oa4ege.execute-api.eu-west-3.amazonaws.com';
    api_socket_connection_url = 'g7fi8sjqt9.execute-api.eu-west-3.amazonaws.com';
    api_web_socket_url = 'g7fi8sjqt9.execute-api.eu-west-3.amazonaws.com';

    console.log('Use master API endpoint');
  }
  return {
    api_endpoint_url: api_endpoint_url,
    api_socket_connection_url: api_socket_connection_url,
    api_web_socket_url: api_web_socket_url,
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
  path: string,
  awsCredentials: AWSCredentials,
  request_parameters: string
): Promise<SignedQueryRequest> => {
  const canonical_uri = getApiEnv() + path;

  // Extract the necessary AWS credentials
  const access_key = awsCredentials?.accessKeyId;
  const secret_key = awsCredentials?.secretAccessKey;
  const method = 'GET';
  const service = 'execute-api';
  const host = getApiEnpdpoints().api_endpoint_url;
  const region = 'eu-west-3';
  const base = API_BASE;
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
  const canonical_querystring = '';

  // Step 6: Create the payload hash using the SHA256 algorithm
  const payload_hash = crypto.SHA256(request_parameters);

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

  // Step 2: Create the string to sign, which includes the algorithm, timestamp, credential scope, and hashed canonical request
  const algorithm = 'AWS4-HMAC-SHA256';
  const credential_scope = date_stamp + '/' + region + '/' + service + '/' + 'aws4_request';
  const string_to_sign =
    algorithm + '\n' + amz_date + '\n' + credential_scope + '\n' + crypto.SHA256(canonical_request);

  // Step 3: Calculate the signature using the signing key and the string to sign
  const signing_key = getSignatureKey(secret_key, date_stamp, region, service);

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
  return {
    method: method,
    baseURL: base + host,
    url: canonical_uri,
    data: request_parameters,
    headers: headers,
  };
};

export const getSignedHeaders = (
  credentials: { accessKeyId: string; secretAccessKey: string; sessionToken: string | undefined },
  region: string | crypto.lib.WordArray,
  host: string
) => {
  // Task 1: Create a canonical request for Signature Version 4
  // Arrange the contents of your request (host, action, headers, etc.) into a standard (canonical) format. The canonical request is one of the inputs used to create a string to sign.
  const t = moment().utc();
  const { accessKeyId, secretAccessKey } = credentials;

  const amzDate = t.format('YYYYMMDDTHHmmss') + 'Z';
  const httpRequestMethod = 'GET'; //axiosConfig.method.toUpperCase();
  const canonicalURI = '/dev';
  const canonicalQueryString = '';
  //const canonicalHeaders = 'host:' + host + '\n' + 'x-amz-date:' + amzDate + '\n';
  const canonicalHeaders = 'host:' + host + '\n';
  //const signedHeaders = 'host;x-amz-date';
  const signedHeaders = 'host';
  const payload = ''; //axiosConfig.data ? JSON.stringify(axiosConfig.data) : '';
  const hashedPayload = createHash(payload);

  const canonicalRequest =
    httpRequestMethod +
    '\n' +
    canonicalURI +
    '\n' +
    canonicalQueryString +
    '\n' +
    canonicalHeaders +
    '\n' +
    signedHeaders +
    '\n' +
    hashedPayload;
  console.log('canonicalRequest');
  console.log(canonicalRequest);
  console.log('');
  const hashedCanonicalRequest = createHash(canonicalRequest);

  //   if you used SHA256, you will specify AWS4-HMAC-SHA256 as the signing algorithm

  // Task 2: Create a string to sign for Signature Version 4
  // Create a string to sign with the canonical request and extra information such as the algorithm, request date, credential scope, and the digest (hash) of the canonical request.
  const algorithm = 'AWS4-HMAC-SHA256';
  const requestDateTime = amzDate;
  const dateStamp = t.format('YYYYMMDD'); // Date w/o time, used in credential scope
  const service = 'execute-api';
  const credentialScope = dateStamp + '/' + region + '/' + service + '/' + 'aws4_request';

  const stringToSign =
    algorithm + '\n' + requestDateTime + '\n' + credentialScope + '\n' + hashedCanonicalRequest;

  console.log('stringToSign');
  console.log(stringToSign);
  // Task 3: Calculate the signature for AWS Signature Version 4
  // Derive a signing key by performing a succession of keyed hash operations (HMAC operations) on the request date, Region, and service, with your AWS secret access key as the key for the initial hashing operation. After you derive the signing key, you then calculate the signature by performing a keyed hash operation on the string to sign. Use the derived signing key as the hash key for this operation.

  const kDate = crypto.HmacSHA256(dateStamp, 'AWS4' + secretAccessKey);
  const kRegion = crypto.HmacSHA256(region, kDate);
  const kService = crypto.HmacSHA256(service, kRegion);
  const kSigning = crypto.HmacSHA256('aws4_request', kService);
  console.log('kSigning: ', crypto.enc.Hex.stringify(kSigning));

  const signature = crypto.enc.Hex.stringify(crypto.HmacSHA256(stringToSign, kSigning));

  // Task 4: Add the signature to the HTTP request
  // After you calculate the signature, add it to an HTTP header or to the query string of the request.
  const authorizationHeader =
    algorithm +
    ' Credential=' +
    accessKeyId +
    '/' +
    credentialScope +
    ', SignedHeaders=' +
    signedHeaders +
    ', Signature=' +
    signature;

  const headers = {
    'X-Amz-Date': amzDate,
    Authorization: authorizationHeader,
    Host: host,
    urlDatas: {
      'X-Amz-Algorithm': algorithm,
      'X-Amz-Credential': accessKeyId + '/' + credentialScope,
      'X-Amz-Date': amzDate,
      'X-Amz-Security-Token': encodeURIComponent(credentials.sessionToken as string),
      'X-Amz-SignedHeaders': signedHeaders,
      'X-Amz-Signature': signature,
    },
  };

  return headers;
};

function createHash(input: string | crypto.lib.WordArray) {
  return crypto.enc.Hex.stringify(crypto.SHA256(input));
}
