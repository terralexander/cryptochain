const PubNub = require('pubnub');

const credentials = {
    publishKey: 'pub-c-e69eb5e2-886f-4576-a0f7-9a5128d42245',
    subscribeKey: 'sub-c-5a02e62a-d572-11e9-ba3a-a62b42f0fdcc',
    secretKey: 'sec-c-YWE3YmFhYTMtZWZkOC00YjRmLTlmYzktM2E3MmU5OTcxNzBh'
};

const CHANNELS = {
    TEST: 'TEST'
  };
  
  class PubSub {
    constructor() {
      this.pubnub = new PubNub(credentials);
  
      this.pubnub.subscribe({ channels: [Object.values(CHANNELS)] });
  
      this.pubnub.addListener(this.listener());
    };
  
  
    listener() {
      return {
        message: messageObject => {
          const { channel, message } = messageObject;
  
          console.log(`Message received. Channel: ${channel}. Message: ${message}`);
        }
      }
    }
  
    publish({ channel, message }) {
      this.pubnub.publish({ message, channel });
    }
  }

  const testPubSub = new PubSub();
    testPubSub.publish({ channel: CHANNELS.TEST, message: 'hello pubnub' });
  
  module.exports = PubSub;