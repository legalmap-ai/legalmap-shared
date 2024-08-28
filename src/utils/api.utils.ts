import moment from 'moment';
import crypto from 'crypto-js';
import { AWSCredentials } from '../stores/StoreUser';

const API_BASE = 'https://';

export interface QueryError extends Error {
  response?: {
    data?: {
      error: string;
      message: string;
    };
  };
}

export interface SignedQueryRequest {
  method: string;
  baseURL: string;
  url: string;
  data: string;
  headers: Record<string, string>;
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
export const getApiEnpdpoint = () => {
  let api_endpoint_url = '';
  if (process.env.DEV) {
    api_endpoint_url = '6zkggqg3qg.execute-api.eu-west-3.amazonaws.com';
    console.log('Use development API endpoint');
  } else {
    api_endpoint_url = 'icf8oa4ege.execute-api.eu-west-3.amazonaws.com';
    console.log('Use master API endpoint');
  }
  return api_endpoint_url;
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
  const host = getApiEnpdpoint();
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
