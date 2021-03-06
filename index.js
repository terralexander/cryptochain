const bodyParser = require('body-parser');
const express = require('express');
const request = require('request');
const path = require('path');
const Blockchain = require('./blockchain');
const PubSub = require('./apps/pubsub');
const TransactionPool = require('./wallet/transaction-pool');
const Wallet = require('./wallet');
const TransactionMiner = require('./apps/transaction-miner');

//const isDevelopment = process.env.ENV === 'development';

const app = express();
const blockchain = new Blockchain();
const transactionPool = new TransactionPool();
const wallet = new Wallet();
const pubsub = new PubSub({ blockchain, transactionPool, wallet });
const transactionMiner = new TransactionMiner({ blockchain, transactionPool, wallet, pubsub });

const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'client/dist')));

// Bellow, get is a fetch type HTTP request, used to read from a back-end
// req = request; res = response;
app.get('/api/blocks', (req, res) => {
    res.json(blockchain.chain);
});

app.post('/api/mine', (req, res) => {
    const { data } = req.body;

    blockchain.addBlock({ data });

    pubsub.broadcastChain();
    
    res.redirect('/api/blocks');
});

app.post('/api/transact', (req, res) => {
    const { amount, recipient } = req.body;

    console.log('req.body', req.body);

    let transaction = transactionPool
    .existingTransaction({ inputAddress: wallet.publicKey });

    try {
        if (transaction) {
            transaction.update({ senderWallet: wallet, recipient, amount });
        } else {
            transaction = wallet.createTransaction({ recipient, amount, chain: blockchain.chain });
        }
    }   catch(error) {
        return res.status(400).json({ type: 'error', message: error.message });
    }

    transactionPool.setTransaction(transaction);
    //console.log('transactionPool', transactionPool);

    pubsub.broadcastTransaction(transaction);

    res.json({ type: 'success', transaction });
});

app.get('/api/transaction-pool-map', (req, res) => {
    res.json(transactionPool.transactionMap);
  });

app.get('/api/mine-transactions', (req, res) => {
transactionMiner.mineTransactions();

res.redirect('/api/blocks');
});

app.get('/api/wallet-info', (req, res) => {
const address = wallet.publicKey;

res.json({ address, balance: Wallet.calculateBalance({ chain: blockchain.chain, address: wallet.publicKey }) })
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, './client/dist/index.html'));
});

app.get('/api/known-addresses', (req, res) => {
    const addressMap = {};

    console.log('BEFORE FOR');

    for (let block of blockchain.chain) {
        console.log('FOR block');
      for (let transaction of block.data) {
        console.log('FOR transaction');
        const recipient = Object.keys(transaction.outputMap);

        console.log('block', block);
        console.log('transaction', transaction);
        
        recipient.forEach(recipient => addressMap[recipient] = recipient);
      }
    }

    console.log(block);
    console.log(transaction);
    
    res.json(Object.keys(addressMap));
});

const syncWithRootState = () => {
    request({ url: `${ROOT_NODE_ADDRESS}/api/blocks` }, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            const rootChain = JSON.parse(body);
            

            // Line bellow was commented to avoid doubling the message of updatating the chain thru replacing it dorun sync - in the peer instance
            console.log('replace chain on a sync with', rootChain);
            blockchain.replaceChain(rootChain);
        };
    });

    request({ url: `${ROOT_NODE_ADDRESS}/api/transaction-pool-map` }, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            const rootTransactionPoolMap = JSON.parse(body);

            console.log('replace transaction pool map on a sync with', rootTransactionPoolMap);

            transactionPool.setMap(rootTransactionPoolMap);
        }
    });
};

    const walletFoo = new Wallet();
    const walletBar = new Wallet();

    // Helper functions START
    // Dummy transactions to see on the front end
    const generateWalletTransaction = ({ wallet, recipient, amount }) => {
        const transaction = wallet.createTransaction({
            recipient, amount, chain: blockchain.chain
        });

        transactionPool.setTransaction(transaction);
    };

    const walletAction = () => generateWalletTransaction({
        wallet, recipient: walletFoo.publicKey, amount: 5
    });

    const walletFooAction = () => generateWalletTransaction({
        wallet, walletFoo, recipient: walletBar.publicKey, amount: 10
    });

    const walletBarAction = () => generateWalletTransaction({
        wallet, walletBar, recipient: wallet.publicKey, amount: 15
    });

    for (let i=0; i<10; i++) {
        if (i%3 === 0) {
            walletAction();
            walletFooAction();
        } else if (i%3 === 1) {
            walletAction();
            walletBarAction();
        } else {
            walletFooAction();
            walletBarAction();
        }

        transactionMiner.mineTransactions();
    }
    // Helper functions STOP

let PEER_PORT;

if (process.env.GENERATE_PEER_PORT === 'true') {
    PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000);
}

const PORT = process.env.PORT || PEER_PORT || DEFAULT_PORT;
app.listen(PORT, () => {
    console.log(`LISTENING @ localhost:${PORT}`);

    if (PORT !== DEFAULT_PORT) {
        syncWithRootState();
    }
});