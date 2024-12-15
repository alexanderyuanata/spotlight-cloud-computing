const axios = require('axios');
const { handleAxiosGetError } = require('../exceptions/ErrorHandler');
const { requestAuthToken } = require('./authenticateService');

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

//function to check if parameter is an array and return the first element if so
function getFirstElement(data) {
  if (data == undefined) return undefined;

  return Array.isArray(data) ? data[0] : data;
}

//function for better encoding URI components
function customEncodeURIComponent(str) {
  // Replace all non-alphanumeric characters except spaces with an empty string
  let cleanedStr = str.replace(/[^a-zA-Z0-9 ]/g, "");
  // Replace spaces with '+'
  return cleanedStr.replace(/ /g, "+");
}

//function to delete a field from an object if it exists
function deleteObjectField(obj, field) {
  if (obj.hasOwnProperty(field)) {
      delete obj[field];
  }
}

function getRandomString(arr) {
  if (!Array.isArray(arr) || arr.length === 0) {
      throw new Error("Input must be a non-empty array");
  }
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

function isNotString(value) {
  return typeof value !== "string";
}

async function sendHeartbeatCheck(url, domain){
  if (isNotString(url)){
    console.error("url is not a string! cannot perform heartbeat check!");
    return false;
  }
  let status = false;

  try {
    const token = await requestAuthToken(url, domain);

    await axios.get(url,{
      headers:{
        'Authorization':`Bearer ${token}`,
      }
    })
    .then(async function (response) {
      status = (response.status == 200);
    })
    .catch(function (error) {
      handleAxiosGetError();
    })
    .finally(function () {
      // always executed
    });
  }
  catch(error){
    console.error('failed in fetching auth token!');
    return false;
  }

  return status;
}

module.exports = { getRandomIntInclusive, getFirstElement, customEncodeURIComponent, deleteObjectField, getRandomString, isNotString, sendHeartbeatCheck }