const Block = require('./block');
const { cryptoHash } = require('../util');

class Blockchain {
    constructor() {
        this.chain = [Block.genesis()];
    }

    addBlock({ data }) {
        const newBlock = Block.mineBlock({
            lastBlock: this.chain[this.chain.length-1], data
        });

        this.chain.push(newBlock);
    }

    replaceChain(chain) {
        if (chain.length <= this.chain.length) {
            console.error('The incoming chain must be longer');
            return;
        };

        if (!Blockchain.isValidChain(chain)) {
            console.error('The incoming chain must be valid');
            return;
        }

        console.log('Replacing chain with', chain);        
        this.chain = chain;
    };

    static isValidChain(chain) {
        if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis()))  {    return false
        };

        for (let i=1; i<chain.length; i++) {
            const { timestamp, lastHash, hash, nonce, difficulty, data } = chain[i];

            // Below, we use regenerate the hash using all the existing fields in the block to make sure that the hash that is presented is correct
            const actualLastHash = chain[i-1].hash;
            const lastDifficulty = chain[i-1].difficulty;

            if (lastHash !== actualLastHash) return false;

            const validatedHash = cryptoHash(timestamp, lastHash, nonce, difficulty, data);

            if (hash !== validatedHash) return false;

            // Below we verify that the difficulty hasn`t been changed by more than 1; Math.abs loop-function makes it that the jump verification goes both ways, increment and decrement
            if (Math.abs(lastDifficulty - difficulty) > 1) return false;
        };
        

        return true;
    };
};

module.exports = Blockchain;