// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable */

import crypto from 'crypto-js';
// import { URL } from 'url';
import querystring from 'querystring';

class SimpleLRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }
    const value = this.cache.get(key)!;
    // Move the key to the end to show that it was recently used
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // Remove the key so we can re-insert it at the end
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove the first item in the Map (the least recently used)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  delete(key: K): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

const credentialsCache = new SimpleLRUCache<string, string>(1000);

function hmac(key: string, string: string, encoding?: crypto.Encoder): string {
  return crypto.HmacSHA256(string, key).toString(encoding || crypto.enc.Hex);
}

function hash(string: string, encoding?: crypto.Encoder): string {
  return crypto.SHA256(string).toString(encoding || crypto.enc.Hex);
}

function encodeRfc3986(urlEncodedString: string): string {
  return urlEncodedString.replace(
    /[!'()*]/g,
    (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase()
  );
}

function encodeRfc3986Full(str: string): string {
  return encodeRfc3986(encodeURIComponent(str));
}

const HEADERS_TO_IGNORE: Record<string, boolean> = {
  authorization: true,
  connection: true,
  'x-amzn-trace-id': true,
  'user-agent': true,
  expect: true,
  'presigned-expires': true,
  range: true,
};

export interface Request {
  path?: string;
  body?: string;
  host?: string;
  method?: string;
  headers?: Record<string, string>;
  service?: string;
  region?: string;
  signQuery?: boolean;
  doNotModifyHeaders?: boolean;
  port?: number;
  hostname?: string;
  extraHeadersToIgnore?: Record<string, boolean>;
  extraHeadersToInclude?: Record<string, boolean>;
}

export interface Credentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

export class RequestSigner {
  request: Request;
  credentials: Credentials;
  service: string;
  region: string;
  isCodeCommitGit: boolean;
  extraHeadersToIgnore: Record<string, boolean>;
  extraHeadersToInclude: Record<string, boolean>;
  parsedPath: { path: string; query: Record<string, string | string[]> };
  datetime?: string;
  filteredHeaders?: [string, string][];

  constructor(request: Request, credentials?: Credentials) {
    if (typeof request === 'string') request = new URL(request);
    const headers = (request.headers = { ...request.headers });
    const hostParts = this.matchHost(
      request.hostname || request.host || headers.Host || headers.host
    );

    this.headers = headers;
    this.request = request;
    this.credentials = credentials || this.defaultCredentials();

    this.service = request.service || hostParts[0] || '';
    this.region = request.region || hostParts[1] || 'us-east-1';

    if (this.service === 'email') this.service = 'ses';

    if (!request.method && request.body) request.method = 'POST';

    if (!headers.Host && !headers.host) {
      headers.Host = request.hostname || request.host || this.createHost();

      if (request.port) headers.Host += ':' + request.port;
    }

    if (!request.hostname && !request.host) request.hostname = headers.Host || headers.host;

    this.isCodeCommitGit = this.service === 'codecommit' && request.method === 'GIT';

    this.extraHeadersToIgnore = request.extraHeadersToIgnore || {};
    this.extraHeadersToInclude = request.extraHeadersToInclude || {};
  }

  matchHost(host: string): [string, string] {
    const match = (host || '').match(/([^\.]{1,63})\.(?:([^\.]{0,63})\.)?amazonaws\.com(\.cn)?$/);
    let hostParts = (match || []).slice(1, 3);

    if (hostParts[1] === 'es' || hostParts[1] === 'aoss') hostParts = hostParts.reverse();

    if (hostParts[1] == 's3') {
      hostParts[0] = 's3';
      hostParts[1] = 'us-east-1';
    } else {
      for (let i = 0; i < 2; i++) {
        if (/^s3-/.test(hostParts[i])) {
          hostParts[1] = hostParts[i].slice(3);
          hostParts[0] = 's3';
          break;
        }
      }
    }

    return hostParts as [string, string];
  }

  isSingleRegion(): boolean {
    if (['s3', 'sdb'].includes(this.service) && this.region === 'us-east-1') return true;

    return ['cloudfront', 'ls', 'route53', 'iam', 'importexport', 'sts'].includes(this.service);
  }

  createHost(): string {
    const region = this.isSingleRegion() ? '' : '.' + this.region;
    const subdomain = this.service === 'ses' ? 'email' : this.service;
    return `${subdomain}${region}.amazonaws.com`;
  }

  prepareRequest() {
    this.parsePath();

    const { request, headers } = this;
    let query: Record<string, string | string[]> | null = null;

    if (request.signQuery) {
      this.parsedPath.query = query = this.parsedPath.query || {};

      if (this.credentials.sessionToken)
        query['X-Amz-Security-Token'] = this.credentials.sessionToken;

      if (this.service === 's3' && !query['X-Amz-Expires']) query['X-Amz-Expires'] = '86400';

      if (query['X-Amz-Date']) this.datetime = query['X-Amz-Date'];
      else query['X-Amz-Date'] = this.getDateTime();

      query['X-Amz-Algorithm'] = 'AWS4-HMAC-SHA256';
      query['X-Amz-Credential'] = this.credentials.accessKeyId + '/' + this.credentialString();
      query['X-Amz-SignedHeaders'] = this.signedHeaders();
    } else {
      if (!request.doNotModifyHeaders && !this.isCodeCommitGit) {
        if (request.body && !headers['Content-Type'])
          headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=utf-8';

        if (request.body && !headers['Content-Length'])
          headers['Content-Length'] = Buffer.byteLength(request.body).toString();

        if (this.credentials.sessionToken && !headers['X-Amz-Security-Token'])
          headers['X-Amz-Security-Token'] = this.credentials.sessionToken;

        if (this.service === 's3' && !headers['X-Amz-Content-Sha256'])
          headers['X-Amz-Content-Sha256'] = hash(this.request.body || '', crypto.enc.Hex);

        if (headers['X-Amz-Date']) this.datetime = headers['X-Amz-Date'];
        else headers['X-Amz-Date'] = this.getDateTime();
      }

      delete headers.Authorization;
      //delete headers.authorization;
    }
  }

  sign(): Request {
    if (!this.parsedPath) this.prepareRequest();

    if (this.request.signQuery) {
      this.parsedPath.query['X-Amz-Signature'] = this.signature();
      this.request.headers!.Authorization = this.authHeader();
    } else {
      this.request.headers!.Authorization = this.authHeader();
    }

    this.request.path = this.formatPath();

    return this.request;
  }

  getDateTime(): string {
    if (!this.datetime) {
      const headers = this.request.headers!;
      const date = new Date(headers.Date || new Date());

      this.datetime = date.toISOString().replace(/[:\-]|\.\d{3}/g, '');

      if (this.isCodeCommitGit) this.datetime = this.datetime.slice(0, -1);
    }
    return this.datetime;
  }

  getDate(): string {
    return this.getDateTime().substr(0, 8);
  }

  authHeader(): string {
    return [
      'AWS4-HMAC-SHA256 Credential=' + this.credentials.accessKeyId + '/' + this.credentialString(),
      'SignedHeaders=' + this.signedHeaders(),
      'Signature=' + this.signature(),
    ].join(', ');
  }

  signature(): string {
    const date = this.getDate();
    const cacheKey = [this.credentials.secretAccessKey, date, this.region, this.service].join();
    let kCredentials = credentialsCache.get(cacheKey);
    let kCredentials2;
    if (!kCredentials) {
      const kDate = hmac('AWS4' + this.credentials.secretAccessKey, date);
      const kDate2 = crypto.HmacSHA256(date, 'AWS4' + this.credentials.secretAccessKey);

      const kRegion = hmac(kDate, this.region);
      const kRegion2 = crypto.HmacSHA256(this.region, kDate2);

      const kService = hmac(kRegion, this.service);
      const kService2 = crypto.HmacSHA256(this.service, kRegion2);

      kCredentials = hmac(kService, 'aws4_request');
      kCredentials2 = crypto.HmacSHA256('aws4_request', kService2).toString();

      credentialsCache.set(cacheKey, kCredentials);
    }

    //daxte version

    const signed1 = crypto.HmacSHA256(kCredentials, this.stringToSign());
    const signed2 = crypto.HmacSHA256(kCredentials2, this.stringToSign());
    debugger;
    return hmac(kCredentials, this.stringToSign(), crypto.enc.Hex);
  }

  // function getSignatureKey(
  //   key: string | undefined,
  //   dateStamp: string | crypto.lib.WordArray,
  //   regionName: string | crypto.lib.WordArray,
  //   serviceName: string | crypto.lib.WordArray
  // ) {
  //   const kDate = crypto.HmacSHA256(dateStamp, 'AWS4' + key);
  //   const kRegion = crypto.HmacSHA256(regionName, kDate);
  //   const kService = crypto.HmacSHA256(serviceName, kRegion);
  //   const kSigning = crypto.HmacSHA256('aws4_request', kService);
  //   return kSigning;
  // }

  stringToSign(): string {
    return [
      'AWS4-HMAC-SHA256',
      this.getDateTime(),
      this.credentialString(),
      hash(this.canonicalString(), crypto.enc.Hex),
    ].join('\n');
  }

  canonicalString(): string {
    if (!this.parsedPath) this.prepareRequest();

    let pathStr = this.parsedPath.path;
    const query = this.parsedPath.query;
    const headers = this.request.headers!;
    let queryStr = '';
    const normalizePath = this.service !== 's3';
    const decodePath = this.service === 's3' || this.request.doNotEncodePath;
    const decodeSlashesInPath = this.service === 's3';
    const firstValOnly = this.service === 's3';
    let bodyHash: string;

    if (this.service === 's3' && this.request.signQuery) {
      bodyHash = 'UNSIGNED-PAYLOAD';
    } else if (this.isCodeCommitGit) {
      bodyHash = '';
    } else {
      bodyHash = headers['X-Amz-Content-Sha256'] || hash(this.request.body || '', crypto.enc.Hex);
    }

    if (query) {
      const reducedQuery = Object.keys(query).reduce((obj, key) => {
        if (!key) return obj;
        obj[encodeRfc3986Full(key)] = !Array.isArray(query[key])
          ? query[key]
          : firstValOnly
          ? query[key][0]
          : query[key];
        return obj;
      }, {} as Record<string, string | string[]>);
      const encodedQueryPieces: string[] = [];
      Object.keys(reducedQuery)
        .sort()
        .forEach((key) => {
          if (!Array.isArray(reducedQuery[key])) {
            encodedQueryPieces.push(key + '=' + encodeRfc3986Full(reducedQuery[key]));
          } else {
            (reducedQuery[key] as string[])
              .map(encodeRfc3986Full)
              .sort()
              .forEach((val) => encodedQueryPieces.push(key + '=' + val));
          }
        });
      queryStr = encodedQueryPieces.join('&');
    }

    if (pathStr !== '/') {
      if (normalizePath) pathStr = pathStr.replace(/\/{2,}/g, '/');
      pathStr = pathStr
        .split('/')
        .reduce((path, piece) => {
          if (normalizePath && piece === '..') {
            path.pop();
          } else if (!normalizePath || piece !== '.') {
            if (decodePath) piece = decodeURIComponent(piece.replace(/\+/g, ' '));
            path.push(encodeRfc3986Full(piece));
          }
          return path;
        }, [] as string[])
        .join('/');
      if (pathStr[0] !== '/') pathStr = '/' + pathStr;
      if (decodeSlashesInPath) pathStr = pathStr.replace(/%2F/g, '/');
    }

    return [
      this.request.method || 'GET',
      pathStr,
      queryStr,
      this.canonicalHeaders() + '\n',
      this.signedHeaders(),
      bodyHash,
    ].join('\n');
  }

  filterHeaders() {
    const headers = this.request.headers!;
    const extraHeadersToInclude = this.extraHeadersToInclude;
    const extraHeadersToIgnore = this.extraHeadersToIgnore;

    this.filteredHeaders = Object.keys(headers)
      .map((key) => [key.toLowerCase(), headers[key]] as [string, string])
      .filter((entry) => {
        return (
          extraHeadersToInclude[entry[0]] ||
          (HEADERS_TO_IGNORE[entry[0]] == null && !extraHeadersToIgnore[entry[0]])
        );
      })
      .sort((a, b) => (a[0] < b[0] ? -1 : 1));
  }

  canonicalHeaders(): string {
    if (!this.filteredHeaders) this.filterHeaders();

    return this.filteredHeaders
      .map((entry) => {
        return entry[0] + ':' + entry[1].toString().trim().replace(/\s+/g, ' ');
      })
      .join('\n');
  }

  signedHeaders(): string {
    if (!this.filteredHeaders) this.filterHeaders();

    return this.filteredHeaders.map((entry) => entry[0]).join(';');
  }

  credentialString(): string {
    return [this.getDate(), this.region, this.service, 'aws4_request'].join('/');
  }

  defaultCredentials(): Credentials {
    return {
      accessKeyId: process.env.VUE_APP_AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.VUE_APP_AWS_SECRET_ACCESS_KEY || '',
      sessionToken: process.env.VUE_APP_AWS_SESSION_TOKEN || '',
    };
  }

  parsePath() {
    let path = this.request.path || '/';

    if (/[^0-9A-Za-z;,/?:@&=+$\-_.!~*'()#%]/.test(path)) {
      path = encodeURI(decodeURI(path));
    }

    const queryIx = path.indexOf('?');
    let query: Record<string, string | string[]> | null = null;

    if (queryIx >= 0) {
      query = querystring.parse(path.slice(queryIx + 1));
      path = path.slice(0, queryIx);
    }

    this.parsedPath = {
      path: path,
      query: query || {},
    };
  }

  // formatPath(): string {
  //   const path = this.parsedPath.path;
  //   const query = this.parsedPath.query;

  //   if (!query) return path;

  //   if (query[''] != null) delete query[''];

  //   return path + '?' + encodeRfc3986(querystring.stringify(query));
  // }
  formatPath(): string {
    const path = this.parsedPath.path;
    const query = this.parsedPath.query;

    if (!query) return path;

    // Suppression de la clé vide si elle existe
    if (query[''] != null) delete query[''];

    // Utilisation de URLSearchParams pour construire la chaîne de requête
    const searchParams = new URLSearchParams();

    Object.keys(query).forEach((key) => {
      const value = query[key];
      if (Array.isArray(value)) {
        value.forEach((val) => searchParams.append(key, val));
      } else {
        searchParams.append(key, value);
      }
    });

    return path + '?' + encodeRfc3986(searchParams.toString());
  }
}

export function sign(request: Request, credentials?: Credentials): Request {
  return new RequestSigner(request, credentials).sign();
}
