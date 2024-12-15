const { GoogleAuth } = require('google-auth-library');
const auth = new GoogleAuth();

require('dotenv').config();

async function requestAuthToken(url, domain) {
  //get the token client
  const client = await auth.getIdTokenClient(domain);

  //get the id for the request url
  const id = await client.idTokenProvider.fetchIdToken(url);
  return id;
}

module.exports = { requestAuthToken };