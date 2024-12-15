const axios = require("axios");
const { handleAxiosGetError } = require("../exceptions/ErrorHandler");
const {
  deleteObjectField,
  getRandomString,
} = require("../services/miscellaneousFunc");
const { requestAuthToken } = require("../services/authenticateService");

require("dotenv").config();

// configure axios
const instance = axios.create({
  baseURL: process.env.TRAVEL_MODEL_URL || "http://localhost:5000",
  timeout: 10000,
});

// constants
const TRAVEL_LIMIT = 8;

// the links to random travel images
const LOCATION_IMG = [
  "https://storage.googleapis.com/travel-image/candi.jpg",
  "https://storage.googleapis.com/travel-image/colors.jpg",
  "https://storage.googleapis.com/travel-image/culture.jpg",
  "https://storage.googleapis.com/travel-image/danau.jpg",
  "https://storage.googleapis.com/travel-image/exports.jpg",
  "https://storage.googleapis.com/travel-image/gate.jpg",
  "https://storage.googleapis.com/travel-image/gunung.jpg",
  "https://storage.googleapis.com/travel-image/gunung2.jpg",
  "https://storage.googleapis.com/travel-image/jakarta.jpg",
  "https://storage.googleapis.com/travel-image/mist.jpg",
  "https://storage.googleapis.com/travel-image/pagoda.jpg",
  "https://storage.googleapis.com/travel-image/sawah.jpg",
  "https://storage.googleapis.com/travel-image/waterfall.jpg",
];

async function searchDestinations(inputData) {
  let travelLocations = [];
  let token;

  // try and get the authorization token
  try {
    token = await requestAuthToken(
      process.env.TRAVEL_MODEL_URL.concat("/recommend"),
      process.env.TRAVEL_MODEL_URL
    );
  } catch (error) {
    console.error(error.message);
    throw error;
  }

  //send an authenticated POST request to the travel recommendation API
  await instance
    .post("/recommend", inputData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        key: process.env.TRAVEL_API_KEY,
      },
    })
    .then(async (response) => {
      // if the server doesn't return a successful query
      if (response.status != 200) {
        throw err;
      }

      // get the array of travel destinations that the public API returns
      let travelResult = response.data.recommendations;

      // check for the number of destinations and fill it with random destinations
      // if the number is less than TRAVEL_LIMIT
      const leftover = TRAVEL_LIMIT - travelResult.length;
      if (leftover > 0) {
        const filler = (await getRandomDestinations()).slice(0, leftover);
        console.log("added random travel destinations");

        travelResult = travelResult.concat(filler);
      }

      // process data to get the location image
      if (Array.isArray(travelResult)) {
        const promises = travelResult.map(async (location) => {
          //delete useless fields
          deleteObjectField(location, "Categories_Label");
          deleteObjectField(location, "Lat");
          deleteObjectField(location, "Long");
          deleteObjectField(location, "_1");

          // add a random cover img url
          location.coverUrl = getRandomString(LOCATION_IMG);
        });

        await Promise.all(promises);
      }

      // assign processed data
      travelLocations = travelResult;
    })
    .catch((error) => {
      handleAxiosGetError(error);
    })
    .finally(() => {
      //do something when everything is done
    });

  //return fetched data
  return travelLocations;
}

// get random travel destinations
async function getRandomDestinations() {
  let locationDetails = [];
  let token;

  // try and get the authorization token
  try {
    token = await requestAuthToken(
      process.env.TRAVEL_MODEL_URL.concat("/recommend"),
      process.env.TRAVEL_MODEL_URL
    );
  } catch (error) {
    console.error(error.message);
    throw error;
  }

  //send an authenticated request to the travel recommendation API
  await instance
    .post(
      "/recommend",
      {
        text: "random",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          key: process.env.TRAVEL_API_KEY,
        },
      }
    )
    .then(async (response) => {
      //if the server doesn't return a successful query
      if (response.status != 200) {
        throw err;
      }

      //get the array of locations that the public API returns
      const randomLocations = response.data.recommendations;

      //assign raw data
      locationDetails = randomLocations;
    })
    .catch((error) => {
      handleAxiosGetError(error);
    })
    .finally(() => {
      //do something when everything is done
    });

  //return fetched data
  return locationDetails;
}

module.exports = { searchDestinations };
