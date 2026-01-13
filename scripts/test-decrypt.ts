import { decrypt } from '../lib/encryption';

// Test with actual encrypted value from database
const testValue = 'enc::bP9O0xqpFeXikiQ7VLHn7Q==:X2nsdfovj0R6JKyDmUo+DQ==:yIbCtg/y';
console.log('Input:', testValue);
console.log('Decrypted:', decrypt(testValue));
