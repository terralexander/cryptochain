const Block = require('./block');
const Transaction = require('../wallet/transaction');
const Wallet = require('../wallet');
const { cryptoHash } = require('../util');
const { REWARD_INPUT, MINING_REWARD } = require('../config');

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

    replaceChain(chain, validateTransactions, onSuccess) {
        if (chain.length <= this.chain.length) {
            console.error('The incoming chain must be longer');
            return;
        };

        if (!Blockchain.isValidChain(chain)) {
            console.error('The incoming chain must be valid');
            return;
        }

        if (validateTransactions && !this.validTransactionData({ chain })) {
            console.error('The incoming chain has invalid data')
            return;
        }

        if (onSuccess) onSuccess();
        console.log('Replacing chain with', chain);        
        this.chain = chain;
    };

    //Bellow, we validate the chain based on the history stored locally, not based on incoming chain history -  that could else leave it open to fraud 
    validTransactionData({ chain }) {
        for (let i=1; i<chain.length; i++) {
            const block = chain[i];
            //Bellow, we have a native instance of `set` class, allows us to make a collection of unique items;
            //the transactionSet was declared outside the `for` (line 45) and not the `if` (line 46) because we don`t want this instantiated for every transaction, we want it instantiated for every block
            const transactionSet = new Set();
            let rewardTransactionCount = 0;

            for (let transaction of block.data) {
                if (transaction.input.address === REWARD_INPUT.address) {
                    rewardTransactionCount +=1;

                    if (rewardTransactionCount > 1) {
                        console.error('Miner rewards exceed limit');
                        return false;
                    }
    
                    if (Object.values(transaction.outputMap)[0] !== MINING_REWARD) {
                        console.error('Miner reward is invalid');
                        return false;
                    }
                } else {
                    if (!Transaction.validTransaction(transaction)) {
                        console.error('Invalid transaction')
                        return false;
                    }

                    const trueBalance = Wallet.calculateBalance({
                        chain: this.chain,
                        address: transaction.input.address
                    });

                    if (transaction.input.amount !== trueBalance) {
                        console.error('Invalid input amount');
                        return false;
                    }

                    if (transactionSet.has(transaction)) {
                        console.error('An identical trasaction appears more than once in the block');
                        return false;
                    } else {
                        transactionSet.add(transaction);
                    }
                }
            }
        }

        return true;
    }

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