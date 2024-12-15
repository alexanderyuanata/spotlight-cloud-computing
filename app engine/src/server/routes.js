const {
  returnResponse,
  warmupHandler,
  getBooksRecommendation,
  getTravelRecommendation,
  getStressPrediction,
  getMoviesRecommendation,
} = require("./handler");

const joi = require("joi");

const routes = [
  {
    path: "/check",
    method: "GET",
    options: {
      handler: returnResponse,
      description: "Check the status of the backend API server.",
      notes:
        "Always returns a 200 response, used to check the uptime of the server.",
      tags: ["api"],
      response: {
        schema: joi.object({
          status: joi.string().example("success"),
          message: joi.string().example("server is up!"),
        }),
        failAction: 'ignore',
      },
    },
  },

  {
    path: "/warmup",
    method: "GET",
    options: {
      handler: warmupHandler,
      description: "Sends a heartbeat check to wake up idle containers.",
      notes:
        "Sends a HTTP GET heartbeat check to all ML Model APIs running on Cloud Run to make sure that they're up and ready to receive incoming requests.",
      tags: ["api"],
      response: {
        schema: joi.object({
          message: joi.string().example("returning status of backend services"),
          services: joi.object({
            book_api: joi.bool().example(true),
            movie_api: joi.bool().example(true),
            travel_api: joi.bool().example(true),
            stress_api: joi.bool().example(true),
          }),
        }),
        failAction: 'ignore',
      },
    },
  },

  {
    path: "/recommend/books",
    method: "GET",
    options: {
      handler: getBooksRecommendation,
      description:
        "Get a list of book recommendations based on the user UID that is passed as query parameters.",
      notes:
        "The API gets the preference data of the user based on the passed UID, sends it to the model, processes the model output, and returns it as an array of book recommendations.",
      tags: ["api"],
      validate: {
        query: joi.object({
          uid: joi.string(),
        }),
      },
      response: {
        schema: joi.object({
          status: joi.string().example("success"),
          message: joi
            .string()
            .example("returned a list of book recommendations"),
          title_count: joi.number().example(8),
          titles: joi
            .array()
            .items(
              joi.object({
                Author: joi.string().example('J.K. Rowling'),
                Avg_Rating: joi.number().example(4.63),
                Book: joi.string().example('Harry Potter'),
                Description: joi.string().example('This is a description...'),
                Genres: joi.string().example('\[\'Fiction\'\, \'Romance\'\]'),
                coverUrl: joi.string().example('url_to_book_cover'),
                publishYear: joi.string().example('2004'),
                infoUrl: joi.string().example('url_to_book_information'),
              })
            )
            .label("array of titles"),
        }),
        failAction: 'ignore',
      },
    },
  },
  
  {
    path: "/recommend/movies",
    method: "GET",
    options: {
      handler: getMoviesRecommendation,
      description:
        "Get a list of movie recommendations based on the user UID that is passed as query parameters.",
      notes:
        "The API gets the preference data of the user based on the passed UID, sends it to the model, processes the model output, and returns it as an array of movie recommendations.",
      tags: ["api"],
      validate: {
        query: joi.object({
          uid: joi.string(),
        }),
      },
      response: {
        schema: joi.object({
          status: joi.string().example("success"),
          message: joi
            .string()
            .example("successfully retrieved movie recommendations from model"),
          movie_count: joi.number().example(8),
          movies: joi
            .array()
            .items(
              joi.object({
                director: joi.string().example('Alex Garland'),
                genre: joi.string().example('Fantasy'),
                movie_name: joi.string().example('Men'),
                rating: joi.number().example(6.1),
                runtime: joi.number().example(100),
                star: joi.string().example('Jessie Buckley, Rory Kinnear, Paapa Essiedu, Gayle Rankin'),
                votes: joi.number().example(1000),
                year: joi.number().example(2022),
                cover_url: joi.string().example('url_to_movie_poster'),
              })
            )
            .label("array of titles"),
        }),
        failAction: 'ignore',
      },
    },
  },

  {
    path: "/recommend/travel",
    method: "GET",
    options: {
      handler: getTravelRecommendation,
      description:
        "Get a list of travel location recommendations based on the user UID that is passed as query parameters.",
      notes:
        "The API gets the preference data of the user based on the passed UID, sends it to the model, processes the model output, and returns it as an array of locations in Indonesia.",
      tags: ["api"],
      validate: {
        query: joi.object({
          uid: joi.string(),
        }),
      },
      response: {
        schema: joi.object({
          status: joi.string().example("success"),
          message: joi
            .string()
            .example("travel recommendation successfully returned"),
          location_count: joi.number().example(8),
          recommendations: joi
            .array()
            .items(
              joi.object({
                Categories: joi.string().example('Culture'),
                City: joi.string().example('Semarang'),
                Coordinate: joi.string().example('\{\'lat\'\: -7.259886099999998\, \'lng\'\: 110\.4025602\}'),
                Description: joi.string().example('The Palagan Ambarawa Monument is a monument located in Ambarawa, Semarang Regency.\\nThis monument is a symbol to commemorate the history of the battle of Palagan Ambarawa on 12 December - 15 December 1945 in Ambarawa.'),
                Place_Name: joi.string().example('Monumen Palagan Ambarawa'),
                Price: joi.number().example(7500),
                Rating_Count: joi.number().example(30),
                Ratings: joi.number().example(44),
                Time_Minutes: joi.number().example(20),
                coverUrl: joi.string().example('url_to_travel_pictures'),
              })
            )
            .label("array of locations"),
        }),
        failAction: 'ignore',
      },
    },
  },

  {
    path: "/predict/stress",
    method: "GET",
    options: {
      handler: getStressPrediction,
      description:
        "Get the predicted stress level of the user based on their latest survey data.",
      notes:
        "The API gets the survey data of the user based on the passed UID, sends it to the model, processes the model output, and returns it as a number indicating their stress levels.",
      tags: ["api"],
      validate: {
        query: joi.object({
          uid: joi.string(),
        }),
      },
      response: {
        schema: joi.object({
          status: joi.string().example("success"),
          message: joi
            .string()
            .example("stress prediction successful"),
          prediction: joi.number().example(2),
        }),
        failAction: 'ignore',
      },
    },
  },
];

module.exports = routes;
