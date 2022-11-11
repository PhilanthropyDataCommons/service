import fs from 'fs';

const validKeysFile = process.env.API_KEYS_FILE ?? 'test_keys.txt';
const data = fs.readFileSync(validKeysFile, 'utf8').split('\n');
export const dummyApiKey = { 'x-api-key': data[0] };
