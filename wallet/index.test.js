const Wallet = require('./index');
const { verifySignature } = require('../utilities');

describe('Wallet', () => {
    let wallet;

    beforeEach(() => {
        wallet = new Wallet();
    });

    it('has a `balance`', () => {
        expect(wallet).toHaveProperty('balance');
    });

    it('has a `publicKey`', () => {

        //Bellow, we cat test the eliptic curve value which will have an x and an y as an output if the wallet/index.js doesn`t encode into hex (this.publicKey = keyPair.getPublic().encode('hex');)
        //console.log(wallet.publicKey);

        expect(wallet).toHaveProperty('publicKey');
    });

    describe('signing data', () => {
        const data = 'testing-signature';

        it('verifies a signature', () => {
            expect(verifySignature({ publicKey: wallet.publicKey, data, signature: wallet.sign(data) })).toBe(true);
        });

        it('it does not verify an invalid signature', () => {
            expect(verifySignature({ publicKey: wallet.publicKey, data, signature: new Wallet().sign(data) })).toBe(false);
        });
    });

});