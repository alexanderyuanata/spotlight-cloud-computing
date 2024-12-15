const axios = require("axios");
const { handleAxiosGetError } = require("../exceptions/ErrorHandler");
const { getFirstElement, customEncodeURIComponent } = require('../services/miscellaneousFunc');
const { requestAuthToken } = require("../services/authenticateService");

// initialize environment variables
require('dotenv').config();

// axios config for stress predictions
const instance = axios.create({
  // if the model url isn't present, assume we're in dev and use localhost
  baseURL: process.env.STRESS_MODEL_URL || "http://localhost:5000",
  timeout: 10000,
});

// get prediction by sending an authenticated request to the cloud run stress API
async function fetchStressPrediction(input_data){
  let predictedStress;
  let token;

  // try and get the authorization token
  try {
    token = await requestAuthToken(process.env.STRESS_MODEL_URL.concat("/predict"), process.env.STRESS_MODEL_URL);
  }
  catch (error){
    console.error(error.message);
    throw error;
  }

  // send a POST request with input_data as the json payload for the model
  await instance.post(
    "/predict", 
    input_data,
    {
    headers:{
      'Authorization':`Bearer ${token}`,
    },
    params:{
      // truh locally
      key: process.env.STRESS_API_KEY,
    },
  })
  .then(async (response) => {
    // if the server doesn't return an OK query, throw error
    if (response.status != 200){
      throw new Error("stress prediction didnt return a HTTP 200 response!");
    }
    predictedStress = response.data.stress_level;
  })
  .catch((error) => {
    handleAxiosGetError(error);
  })
  .finally(() => {

  })

  // if everything is fine, return the predicted stress level
  return predictedStress;
}

module.exports = fetchStressPrediction;