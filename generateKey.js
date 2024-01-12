const crypto = require('crypto');
const secretKey = crypto.randomBytes(40).toString('hex'); 
console.log(secretKey);