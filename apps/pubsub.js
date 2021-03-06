const PubNub = require('pubnub');

const credentials = {
    publishKey: 'pub-c-e69eb5e2-886f-4576-a0f7-9a5128d42245',
    subscribeKey: 'sub-c-5a02e62a-d572-11e9-ba3a-a62b42f0fdcc',
    secretKey: 'sec-c-YWE3YmFhYTMtZWZkOC00YjRmLTlmYzktM2E3MmU5OTcxNzBh'
};

const CHANNELS = {
    TEST: 'TEST',
    BLOCKCHAIN: 'BLOCKCHAIN',
    TRANSACTION: 'TRANSACTION'
  };
  
  class PubSub {
    constructor({ blockchain, transactionPool, wallet }) {
      this.blockchain = blockchain;
      this.transactionPool = transactionPool;
      this.wallet = wallet;
  
      this.pubnub = new PubNub(credentials);
  
      this.pubnub.subscribe({ channels: [Object.values(CHANNELS)] });
  
      this.pubnub.addListener(this.listener());
    }
  
    broadcastChain() {
      this.publish({
        channel: CHANNELS.BLOCKCHAIN,
        message: JSON.stringify(this.blockchain.chain)
      });
    };
  
    broadcastTransaction(transaction) {
      this.publish({
        channel: CHANNELS.TRANSACTION,
        message: JSON.stringify(transaction)
      });
    };
  
    subscribeToChannels() {
      this.pubnub.subscribe({
        channels: [Object.values(CHANNELS)]
      });
    }
  
    listener() {
      return {
        message: messageObject => {
          const { channel, message } = messageObject;
          
          console.log(`Message received. Channel: ${channel}. Message: ${message}`);
          const parsedMessage = JSON.parse(message);
  
          switch(channel) {
            case CHANNELS.BLOCKCHAIN:
              this.blockchain.replaceChain(parsedMessage, true, () => {
                this.transactionPool.clearBlockchainTransactions(
                  { chain: parsedMessage.chain }
                );
              });
              break;
            case CHANNELS.TRANSACTION:
              if (!this.transactionPool.existingTransaction({
                inputAddress: this.wallet.publicKey
              })) {
                this.transactionPool.setTransaction(parsedMessage);
              } else {
                console.log('IGNORING TRANSACTION: broadcast received from self-publishing')
              }
              break;
            default:
              return;
          }
        }
      }
    }
    
    publish({ channel, message }) {
      this.pubnub.unsubscribe({ channel })
      setTimeout(() => this.pubnub.publish({ channel, message }), 3000)
      setTimeout(() => this.pubnub.subscribe({ channels: [ Object.values(CHANNELS) ] }), 6000)
    }
      /*
      this.pubnub.unsubscribe({ channel }, () => {
        this.pubnub.publish({ channel, message }, () => {
          this.pubnub.subscribe({ channel });
        });
      });
      */
      
      // there is an unsubscribe function in pubnub
      // but it doesn't have a callback that fires after success
      // therefore, redundant publishes to the same local subscriber will be accepted as noisy no-ops
      
      //this.pubnub.publish({ message, channel });

      //setTimeout(() => this.pubnub.publish({ channel, message }), 3000);
  
  
    broadcastChain() {
      this.publish({
        channel: CHANNELS.BLOCKCHAIN,
        message: JSON.stringify(this.blockchain.chain)
      });
    };
  
    broadcastTransaction(transaction) {
      this.publish({
        channel: CHANNELS.TRANSACTION,
        message: JSON.stringify(transaction)
      });
    };
  };
  
  module.exports = PubSub;