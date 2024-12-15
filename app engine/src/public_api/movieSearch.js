const axios = require("axios");
const { handleAxiosGetError } = require("../exceptions/ErrorHandler");
const { customEncodeURIComponent, deleteField, deleteObjectField } = require("../services/miscellaneousFunc");
const { requestAuthToken } = require("../services/authenticateService");

require('dotenv').config();

// configure axios for the movie API
const instance = axios.create({
  // use localhost if environmental variables are not present
  baseURL: process.env.MOVIE_MODEL_URL || "http://localhost:5000",
  timeout: 10000,
});

// make an authenticated request to the cloud run movie API
async function searchMovies(inputData){
  let movieTitles = [];
  let token;

  // try and get the authorization token
  try {
    token = await requestAuthToken(process.env.MOVIE_MODEL_URL.concat("/recommend"), process.env.MOVIE_MODEL_URL);
  }
  catch (error){
    console.error(error.message);
    throw new Error("failed to request authentication token for movie recommendation API!");
  }

  //send a POST request to the movie API along with authorization tokens
  await instance
    .post(
      "/recommend", 
      inputData,
      {
      headers:{
        'Authorization':`Bearer ${token}`,
      },
      params: {
        key: process.env.MOVIE_API_KEY,
      },
    })
    .then(async (response) => {
      //if the server doesn't return a successful query
      if (response.status != 200) {
        throw new Error("movie recommendation API didn't return a proper response!");
      }

      // get the array of movies that the model API returns
      let movieResult = response.data.recommendations;
      
      // process data to get the cover of each movie with OMDB API
      if (Array.isArray(movieResult)) {
        // get the cover url using OMDB api and delete unneeded fields from the payload
        const promises = movieResult.map(async (movie) => {
          const coverUrl = await getMovieCover(movie.movie_name)
          movie.cover_url = coverUrl;

          deleteObjectField(movie, "combined_features");
          deleteObjectField(movie, "similarity_score");
        });

        // wait for all promises to resolve before proceeding
        await Promise.all(promises);
      }

      //assign processed data
      movieTitles = movieResult;
    })
    .catch((error) => {
      handleAxiosGetError(error);
    })
    .finally(() => {
      //do something when everything is done
    });

  //return fetched data
  return movieTitles;
}

// get the public url for movie covers using the OMDB API
async function getMovieCover(title){
  let coverUrl;

  await axios.get(`http://www.omdbapi.com`,{
    timeout: 1000,
    params: {
      apikey: process.env.OMDB_KEY,
      t: customEncodeURIComponent(title),
      r: 'json',
    },
  })
  .then((response)=>{
    // if we got a response, then assign the coverUrl
    coverUrl = response.data.Poster;

    // if there's no cover url then just return an empty string
    if (coverUrl == undefined){
      coverUrl = "";
    }
  })
  .catch((error)=>{
    console.error("movie cover request error");
    handleAxiosGetError(error);

    //return an empty url
    return "";
  })
  .finally(()=>{
    //nothing
  });

  return coverUrl;
}

module.exports = { searchMovies, getMovieCover };