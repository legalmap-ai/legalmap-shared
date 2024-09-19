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

export interface SignedQueryRequestOptions {
  host?: string;
  region?: string;
  protocol?: string;
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
    //api_endpoint = awsconfigDev.aws_cloud_logic_custom[0].endpoint;
    //api_endpoint = 'http://127.0.0.1:3000/dev'; // For development only with sam
    api_endpoint = 'https://bfjhijp599.execute-api.eu-west-3.amazonaws.com/dev'; // For development only with sam
  } else {
    //api_endpoint = awsconfigMaster.aws_cloud_logic_custom[0].endpoint;
    api_endpoint = 'https://lscadm8k8j.execute-api.eu-west-3.amazonaws.com/dev';
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
 * @param method - The HTTP method to be used for the API request (e.g., GET, POST).
 * @param path - The specific API path that the request will target.
 * @param awsCredentials - AWS credentials, including access key, secret key, and optional session token.
 * @param user_request_parameters - Parameters to be included in the request payload or query string.
 * @param useQueryString - Boolean flag to indicate whether to include request parameters in the query string (true for GET requests).
 *
 * @returns A promise that resolves to a SignedQueryRequest object containing the signed request details such as headers, method, and URL.
 */

export const getApiSignedTokenRequest = async (
  method: string,
  path: string,
  awsCredentials: AWSCredentials,
  user_request_parameters: string | unknown,
  useQueryString: boolean = false,
  options?: SignedQueryRequestOptions
): Promise<SignedQueryRequest> => {
  // Extract the necessary AWS credentials
  const access_key = awsCredentials?.accessKeyId;
  const secret_key = awsCredentials?.secretAccessKey;
  const service = 'execute-api';
  const host = options?.host ? options?.host : getApiConfig().endpoint;
  const region = options?.region ? options?.region : getRegion();
  const base = options?.protocol ? options?.protocol + '://' : getApiConfig().protocol + '://';

  const canonical_uri = path; //'/' + getApiConfig().environment + path;
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
  const algorithm = 'AWS4-HMAC-SHA256';
  const credential_scope = date_stamp + '/' + region + '/' + service + '/' + 'aws4_request';

  let canonical_querystring;
  let payload_hash;

  if (method === 'GET') {
    payload_hash = crypto.SHA256('');

    const user_params = new URLSearchParams(user_request_parameters as string);
    const user_sorted_params = new URLSearchParams([...user_params.entries()].sort());
    const formated_user_sorted_params = user_sorted_params.toString().replace(/\+/g, '%20');

    if (useQueryString) {
      const params = [
        'X-Amz-Algorithm=AWS4-HMAC-SHA256',
        `X-Amz-Credential=${encodeURIComponent(access_key + '/' + credential_scope)}`,
        `X-Amz-Date=${amz_date}`,
        'X-Amz-Expires=60', // Expiration en secondes
      ];
      if (user_sorted_params.size > 0) {
        params.push('X-Amz-SignedHeaders=host' + '&' + formated_user_sorted_params);
      } else {
        params.push('X-Amz-SignedHeaders=host');
      }

      if (awsCredentials?.sessionToken) {
        params.push(`X-Amz-Security-Token=${encodeURIComponent(awsCredentials.sessionToken)}`);
      }
      params.sort();

      canonical_querystring = params.join('&');
    } else {
      canonical_querystring = formated_user_sorted_params;
    }
  } else {
    if (user_request_parameters != '') {
      payload_hash = crypto.SHA256(JSON.stringify(user_request_parameters));
    } else {
      payload_hash = crypto.SHA256(user_request_parameters as string);
    }
    canonical_querystring = ''; // Souvent vide pour les autres méthodes
  }

  let canonical_headers;
  let signed_headers;

  canonical_headers = 'host:' + host + '\n';
  signed_headers = 'host';

  if (!useQueryString) {
    canonical_headers +=
      'x-amz-content-sha256:' + payload_hash + '\n' + 'x-amz-date:' + amz_date + '\n';

    signed_headers += ';x-amz-content-sha256;x-amz-date';
  }

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

  const string_to_sign =
    algorithm +
    '\n' +
    amz_date +
    '\n' +
    credential_scope +
    '\n' +
    crypto.SHA256(canonical_request as string);

  const signing_key = getSignatureKey(secret_key, date_stamp, region, service);

  console.log('');
  console.log('string_to_sign');
  console.log(string_to_sign);

  const signature = crypto.HmacSHA256(string_to_sign, signing_key);

  if (useQueryString) {
    const temp_canonical_querystring = canonical_querystring + `&X-Amz-Signature=${signature}`;
    const canonical_params = new URLSearchParams(temp_canonical_querystring as string);
    const sorted_params = new URLSearchParams([...canonical_params.entries()].sort());
    canonical_querystring = sorted_params.toString();
  }

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

  const headers = {
    'X-Amz-Content-Sha256': payload_hash as unknown as string,
    'X-Amz-Date': amz_date,
    'x-amz-security-token': awsCredentials?.sessionToken ?? '',
    Authorization: authorization_header,
    'Content-Type': content_type,
    //'X-Amz-Target': amz_target, // Uncomment this if targeting a specific API operation
  };

  let url = '';

  if (method === 'GET' && useQueryString == true) {
    url = canonical_uri + (useQueryString ? '?' + canonical_querystring : user_request_parameters);
  } else {
    url = canonical_uri;
  }

  return {
    method: method,
    baseURL: base + host,
    url: url,
    data: user_request_parameters,
    headers: headers,
  };
};
