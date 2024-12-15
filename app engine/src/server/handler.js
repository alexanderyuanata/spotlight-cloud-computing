const { searchBooks } = require("../public_api/bookSearch");
const { searchMovies } = require("../public_api/movieSearch");

const axios = require("axios");

const {
  checkUid,
  getStressSurvey,
  getPreferencesSurvey,
} = require("../services/userService");

const {
  getRandomIntInclusive,
  sendHeartbeatCheck,
} = require("../services/miscellaneousFunc");

const fetchStressPrediction = require("../public_api/stressPrediction");
const { searchDestinations } = require("../public_api/destinationSearch");

const STRESS_API_DOMAIN = process.env.STRESS_MODEL_URL;
const BOOK_API_DOMAIN = process.env.BOOK_MODEL_URL;
const MOVIE_API_DOMAIN = process.env.MOVIE_MODEL_URL;
const TRAVEL_API_DOMAIN = process.env.TRAVEL_MODEL_URL;


function returnResponse(request, h) {
  const response = h.response({
    status: "success",
    message: "backend server is up",
  });
  response.code(200);

  return response;
}

async function warmupHandler(request, h) {
  let serviceStatus = {};

  serviceStatus.book_api = await sendHeartbeatCheck(
    BOOK_API_DOMAIN+"/check",
    BOOK_API_DOMAIN
  );
  serviceStatus.movie_api = await sendHeartbeatCheck(
    MOVIE_API_DOMAIN+"/check",
    MOVIE_API_DOMAIN
  );
  serviceStatus.travel_api = await sendHeartbeatCheck(
    TRAVEL_API_DOMAIN+"/check",
    TRAVEL_API_DOMAIN
  );
  serviceStatus.stress_api = await sendHeartbeatCheck(
    STRESS_API_DOMAIN+"/check",
    STRESS_API_DOMAIN
  );

  let statusCode = 200;
  serviceStatus.book_api &&
  serviceStatus.movie_api &&
  serviceStatus.travel_api &&
  serviceStatus.stress_api
    ? (statusCode = 200)
    : (statusCode = 503);

  const response = h.response({
    message: "returning status of backend services",
    services: serviceStatus,
  });
  response.code(statusCode);

  return response;
}

//handler to get book recommendation of a specific user
async function getBooksRecommendation(request, h) {
  //ambil uid dari request param, cek, klo gdk return 404 baru bilang uid gdk di database
  const user_id = request.query.uid;

  //ingat await, pastikan uid ada dan data sudah diambil sebelum lanjut
  if (!(await checkUid(user_id))) {
    //kalau uid gdk, return not found
    const response = h.response({
      status: "failure",
      message: "no uid found in database",
    });
    response.code(404);

    return response;
  }

  //ambil data survey dari uid
  const surveyData = await getPreferencesSurvey(user_id);

  //kalau undefined berarti ada yg salah di database/server
  if (surveyData == undefined) {
    const response = h.response({
      status: "failure",
      message: "something went wrong, no survey data found in database",
    });
    response.code(500);

    return response;
  }

  // data preprocessing
  // deconstruct the object
  const {
    book_first_question,
    book_second_question,
    book_third_question,
    book_fourth_question,
    book_fifth_question,
  } = surveyData;

  const bookPref = {};

  // preprocess our data
  book_first_question == "No, I need recommendations"
    ? (bookPref.text = "random")
    : (bookPref.text = book_first_question);

  if (book_second_question != "No, I need recommendations") {
    bookPref.author = book_second_question;
  }

  if (
    book_third_question != "No, I need recommendations" &&
    book_first_question == "No, I need recommendations"
  ) {
    bookPref.text = book_third_question;
  }

  if (book_fourth_question == "No preferences") {
    switch (book_fourth_question) {
      case "3 stars":
        bookPref.rating_preference = 3;
      case "4 stars":
        bookPref.rating_preference = 4;
      case "5 stars":
        bookPref.rating_preference = 5;
      default:
        bookPref.rating_preference = 3;
    }
  }

  // fifth question idk? for now dont use
  console.log(bookPref);

  try {
    let books = await searchBooks(bookPref);

    const response = h.response({
      status: "success",
      message: "returned a list of book recommendations",
      title_count: books.length,
      titles: books,
    });
    response.code(200);

    return response;
  } catch (error) {
    const response = h.response({
      status: "failure",
      message: "something went wrong when getting the recommendations",
      error_msg: error.message,
    });
    response.code(500);

    return response;
  }
}

//handler for movies
async function getMoviesRecommendation(request, h) {
  //ambil uid dari request param, cek, klo gdk return 404 baru bilang uid gdk di database
  const user_id = request.query.uid;

  //ingat await, pastikan uid ada dan data sudah diambil sebelum lanjut
  if (!(await checkUid(user_id))) {
    //kalau uid gdk, return not found
    const response = h.response({
      status: "failure",
      message: "no uid found in database",
    });
    response.code(404);

    return response;
  }

  //ambil data survey dari uid
  const surveyData = await getPreferencesSurvey(user_id);

  //kalau undefined berarti ada yg salah di database/server
  if (surveyData == undefined) {
    const response = h.response({
      status: "failure",
      message: "something went wrong, no survey data found in database",
    });
    response.code(500);

    return response;
  }

  //preprocess survey data
  //deconstruct survey data
  const {
    movie_first_question,
    movie_second_question,
    movie_third_question,
    movie_fourth_question,
    movie_fifth_question,
    movie_sixth_question,
    movie_seventh_question,
  } = surveyData;

  let inputData = {};

  // get the year of the movie
  switch (movie_first_question) {
    case "Last 5 years":
      inputData.year = 2019;
      break;
    case "Last 10 years":
      inputData.year = 2014;
      break;
    case "Last 20 years":
      inputData.year = 2004;
      break;
    case "Any year":
      inputData.year = 1900;
      break;
    default:
      inputData.year = 1900;
      break;
  }

  // get the runtime of the movie
  switch (movie_second_question) {
    case "Short (less than 90 minutes)":
      inputData.runtime = 90;
      break;
    case "Regular (less than 150 minutes)":
      inputData.runtime = 150;
      break;
    case "Long (more than 150 minutes)":
      inputData.runtime = 500;
      break;
    default:
      inputData.runtime = 150;
      break;
  }

  // get the genre of the movie
  inputData.genre = movie_third_question;

  // get the rating of the movie
  inputData.rating = parseInt(movie_fourth_question);

  if (movie_fifth_question != "No, I need recommendations") {
    inputData.director = movie_fifth_question;
  }

  if (movie_sixth_question != "No, I need recommendations") {
    inputData.star = movie_sixth_question;
  }

  switch (movie_seventh_question) {
    case "Movies that are lesser-known":
      inputData.votes = getRandomIntInclusive(0, 5000);
      break;
    case "Movies that are talked about quite often":
      inputData.votes = getRandomIntInclusive(5001, 10000);
      break;
    case "Popular movies that many people know about":
      inputData.votes = getRandomIntInclusive(10001, 15000);
      break;
    default:
      inputData.votes = getRandomIntInclusive(5001, 10000);
      break;
  }

  try {
    let movies = await searchMovies(inputData);

    const response = h.response({
      status: "success",
      message: "successfully retrieved movie recommendation from model",
      movie_count: movies.length,
      movies: movies,
    });

    response.code(200);
    return response;
  } catch (error) {
    const response = h.response({
      status: "failure",
      message: "something went wrong when getting the recommendations",
      error_msg: error.message,
    });

    response.code(500);
    return response;
  }
}

//handler for travel
async function getTravelRecommendation(request, h) {
  //ambil uid dari request param, cek, klo gdk return 404 baru bilang uid gdk di database
  const uid = request.query.uid;

  //ingat await, pastikan uid ada dan data sudah diambil sebelum lanjut
  if (!(await checkUid(uid))) {
    //kalau uid gdk, return not found
    const response = h.response({
      status: "failure",
      message: "no uid found in database",
    });
    response.code(404);

    return response;
  }

  // TODO, ambil data dari database disini, hanya berkaitan dengan survey lokasi wisata
  const surveyData = await getPreferencesSurvey(uid);
  if (surveyData == undefined) {
    const response = h.response({
      status: "failure",
      message: "something went wrong, no survey data found in database",
    });
    response.code(500);

    return response;
  }

  const {
    tour_first_question,
    tour_second_question,
    tour_third_question,
    tour_fourth_question,
    tour_fifth_question,
    tour_sixth_question,
  } = surveyData;

  let travelPref = {};

  tour_first_question == "No, I need recommendations"
    ? (travelPref.text = "random")
    : (travelPref.text = tour_first_question);

  if (tour_second_question != "No, I need recommendations") {
    travelPref.text = travelPref.text.concat(" ", tour_second_question);
  }

  travelPref.text = travelPref.text.concat(" ", tour_third_question);

  travelPref.city = tour_fourth_question;

  travelPref.rating_preference = tour_fifth_question;

  travelPref.review_preference = tour_sixth_question;

  console.log(travelPref);

  if (!travelPref.text) {
    const response = h.response({
      status: "failure",
      message: "text is required for the model to work",
    });
    response.code(400);
    return response;
  }

  // TODO buat POST request dengan body pakai json di atas ke https://travel-recommendation-4nqq6tztla-et.a.run.app?key=API_KEY
  // api key dalam bentuk environment variable (ini ada dalam .gitignore, bisa dibuat di lokal buat ujicoba tapi jangan dipush)
  // untuk .env ada sendiri di cloud, aku yg samain, yg penting API_KEY jangan di expose di code (best practice)
  try {
    const recommendedLocations = await searchDestinations(travelPref);

    const response = h.response({
      status: "success",
      message: "travel recommendation successfully returned",
      location_count: recommendedLocations.length,
      recommendations: recommendedLocations,
    });

    response.code(200);
    return response;
  } catch (error) {
    const response = h.response({
      status: "failure",
      message: "Failed to get travel recommendation",
      error: error.message,
    });

    response.code(500);
    return response;
  }
}

//handler for stress prediction
async function getStressPrediction(request, h) {
  //ambil uid dari request param, cek, klo gdk return 404 baru bilang uid gdk di database
  const user_id = request.query.uid;

  //ingat await, pastikan uid ada dan data sudah diambil sebelum lanjut
  if (!(await checkUid(user_id))) {
    //kalau uid gdk, return not found
    const response = h.response({
      status: "failure",
      message: "no uid found in database",
    });
    response.code(404);

    return response;
  }

  //ambil data survey dari uid
  const surveyData = await getStressSurvey(user_id);

  //kalau undefined berarti ada yg salah di database/server
  if (surveyData == undefined) {
    const response = h.response({
      status: "failure",
      message: "something went wrong, no survey data found in database",
    });
    response.code(500);

    return response;
  }

  //proses data sebelum dikirim ke model
  const payload = {};
  let rawData;
  let processedData;

  //data durasi tidur
  rawData = parseInt(surveyData["stress_first_question"], 10);
  payload["sleep_duration"] = rawData;

  //data kualitas tidur
  rawData = surveyData["stress_second_question"];
  switch (rawData) {
    case "Poor":
      processedData = getRandomIntInclusive(1, 4);
      break;
    case "Fair":
      processedData = getRandomIntInclusive(5, 7);
      break;
    case "Good":
      processedData = getRandomIntInclusive(8, 10);
      break;
    default:
      processedData = getRandomIntInclusive(5, 7);
      break;
  }
  payload["sleep_quality"] = processedData;

  //data aktivitas fisik
  rawData = surveyData["stress_third_question"];
  switch (rawData) {
    case "Lightly Active":
      processedData = getRandomIntInclusive(10, 40);
      break;
    case "Moderately Active":
      processedData = getRandomIntInclusive(41, 70);
      break;
    case "Heavily Active":
      processedData = getRandomIntInclusive(71, 100);
      break;
    default:
      processedData = getRandomIntInclusive(41, 70);
      break;
  }
  payload["physical_activity"] = processedData;

  //data kategori bmi
  rawData = surveyData["stress_fourth_question"];
  switch (rawData) {
    case "Normal":
      processedData = 0;
      break;
    case "Overweight and Underweight":
      processedData = 1;
      break;
    case "Obesity":
      processedData = 2;
      break;
    default:
      processedData = 0;
      break;
  }
  payload["bmi"] = processedData;

  //data tekanan darah
  rawData = surveyData["stress_fifth_question"];
  switch (rawData) {
    case "Low":
      processedData = getRandomIntInclusive(0, 7);
      break;
    case "Normal":
      processedData = getRandomIntInclusive(8, 16);
      break;
    case "High":
      processedData = getRandomIntInclusive(17, 24);
      break;
    default:
      processedData = getRandomIntInclusive(8, 16);
      break;
  }
  payload["blood_pressure"] = processedData;

  //data denyut jantung
  rawData = surveyData["stress_sixth_question"];
  switch (rawData) {
    case "Low":
      processedData = getRandomIntInclusive(30, 59);
      break;
    case "Normal":
      processedData = getRandomIntInclusive(60, 79);
      break;
    case "High":
      processedData = getRandomIntInclusive(80, 95);
      break;
    default:
      processedData = getRandomIntInclusive(60, 79);
      break;
  }
  payload["heart_rate"] = processedData;

  //data langkah kaki
  rawData = surveyData["stress_seventh_question"];
  switch (rawData) {
    case "Rarely":
      processedData = getRandomIntInclusive(1000, 4000);
      break;
    case "Occasionally":
      processedData = getRandomIntInclusive(4001, 7000);
      break;
    case "Frequently":
      processedData = getRandomIntInclusive(7001, 10000);
      break;
    default:
      processedData = getRandomIntInclusive(4001, 7000);
      break;
  }
  payload["daily_steps"] = processedData;

  //data sleep disorder
  rawData = surveyData["stress_eight_question"];
  if (rawData == "Yes") {
    payload["sleep_disorder"] = 1;
  } else {
    payload["sleep_disorder"] = 0;
  }

  //finished processing, send to model and wait
  const prediction = await fetchStressPrediction(payload);
  console.log(prediction);

  //send back as response
  const response = h.response({
    status: "success",
    message: "stress prediction successful",
    prediction: prediction,
  });
  response.code(200);

  return response;
}

module.exports = {
  returnResponse,
  warmupHandler,
  getBooksRecommendation,
  getMoviesRecommendation,
  getTravelRecommendation,
  getStressPrediction,
};
