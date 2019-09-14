const EC =  require('elliptic').ec;
const cryptoHash = require('./crypto-hash');


// Bellow, we are implementing an eliptic curve algorithm
// secp = Standards of Efficient Criptography Prime 256bits Koblitz (most notable co-creator)
// in the eliptic base algorithm a crucial step is to use a prime number to generate the curve
const ec = new EC('secp256k1');

const verifySignature = ({ publicKey, data, signature }) => {
    const keyFromPublic = ec.keyFromPublic(publicKey, 'hex');

    return keyFromPublic.verify(cryptoHash(data), signature);
};

module.exports = { ec, verifySignature, cryptoHash };
