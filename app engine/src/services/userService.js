// const { string } = require('@tensorflow/tfjs-node');
const database = require('../config/firebaseConfig');

// for debugging only
// database.ref("/Users/5tyMCCOkKtgAZWyzOfhFHaV9cCt2").once("value", function (snapshot) {
//   console.log(snapshot.val());
// });

async function checkUid(uid) {
  try {
    const snapshot = await database.ref(`/Users/${uid}`).once('value');
    
    if (snapshot.exists()) {
      return true // Return user data if exists
    } else {
      return false;
    }
  } catch (error) {
    if (error.message === 'User not found') {
      return { status: 404, message: 'User not found' };
    } else {
      return { status: 500, message: 'Internal Server Error' };
    }
  }
}

async function getStressSurvey(uid){
  try {
    console.log(uid + ' is looked for');
    const snapshot = await database.ref('stress_surveys').orderByChild('user_id').equalTo(`${uid}`).once('value');
    const surveyRef = snapshot.val();

    //access the first key since the data we need is nested
    const referenceKey = Object.keys(surveyRef)[0];
    const surveyData = surveyRef[referenceKey];

    if (snapshot.exists()) {
      return surveyData; // Return user data if exists
    } else {
      return undefined;
    }
  } catch (error) {
    console.log(error.message);
  }
}

async function getPreferencesSurvey(uid){
  try {
    const snapshot = await database.ref('recommendation_surveys').orderByChild('user_id').equalTo(`${uid}`).once('value');
    const surveyRef = snapshot.val();

    //access the first key since the data we need is nested
    const referenceKey = Object.keys(surveyRef)[0];
    const surveyData = surveyRef[referenceKey];

    if (snapshot.exists()) {
      return surveyData; // Return user data if exists
    } else {
      return undefined;
    }
  } catch (error) {
    console.log(error.message);
  }
}

module.exports = { checkUid, getStressSurvey, getPreferencesSurvey };
