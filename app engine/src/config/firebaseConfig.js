const admin = require('firebase-admin');
const path = require('path');

require('dotenv').config()

const REALTIME_DATABASE_URL = process.env.REALTIME_DATABASE

// Memuat file kunci akun layanan
const serviceAccount = require (path.join(__dirname, './firebaseServiceAccount.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: REALTIME_DATABASE_URL
});

const database = admin.database();

module.exports = database;
