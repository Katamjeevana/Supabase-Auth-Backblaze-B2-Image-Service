const B2 = require('backblaze-b2');

const b2 = new B2({
  applicationKeyId: process.env.B2_APPLICATION_KEY_ID,
  applicationKey: process.env.B2_APPLICATION_KEY
});

// Initialize and authorize
let authResponse;
const initializeB2 = async () => {
  try {
    authResponse = await b2.authorize();
    console.log('Backblaze B2 authorized successfully');
  } catch (error) {
    console.error('Error authorizing with Backblaze B2:', error);
    throw error;
  }
};

module.exports = { b2, initializeB2 };