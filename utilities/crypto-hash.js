const crypto = require('crypto');
const hexToBinary = require('hex-to-binary');

// Below, ... (three dots) is a JS spread operator, all the arguments are added in a single array called inputs
const cryptoHash = (...inputs) => {
    const hash = crypto.createHash('sha256');

    // Below, we have a method to access the hash value within the hash object
    hash.update(inputs.sort().join(''));

    // Below, in the NPM test we will have a readable result of the hash
    return hash.digest('hex');
};


module.exports = cryptoHash;