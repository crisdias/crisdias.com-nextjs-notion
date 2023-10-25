const { URL } = require('url');

const src = 'https://www.notion.so/image/https://s3-us-west-2.amazonaws.com/secure.notion-static.com/904aed9d-8100-4bd0-bdbb-e5d708ff7d8e/crisdias_steampunk_typewriter_205420d6-d186-4b82-8a9e-f34bfaae1a76.png?table=block&id=0302c9a9-82e2-41ac-aa20-a4fb211c653e&cache=v2';

const q = 75;
const width = 500;
const baseURL = 'http://localhost:8000';
const base64URL = Buffer.from(src).toString('base64');
const urlEncoded = encodeURIComponent(base64URL);

const newURL = new URL(width + '/' + q + '/' + urlEncoded, baseURL);

console.log(newURL.toString());
