const Hapi = require("@hapi/hapi");
const routes = require("../server/routes");

const Inert = require("@hapi/inert");
const Vision = require("@hapi/vision");
const HapiSwagger = require("hapi-swagger");

require("dotenv").config();

(async () => {
  const server = Hapi.server({
    port: parseInt(process.env.PORT) || 8080,
    host: "0.0.0.0",
    routes: {
      cors: {
        origin: ["*"],
      },
    },
  });

  //fetch routes
  server.route(routes);

  //handle errors
  server.ext("onPreResponse", function (request, h) {
    //put error handlers here

    return h.continue;
  });

  //generate documentation with swagger
  const swaggerOptions = {
    info: {
      title: "Spotlight API Documentation",
    },
  };

  await server.register([
    Inert,
    Vision,
    {
      plugin: HapiSwagger,
      options: swaggerOptions,
    },
  ]);

  try {
    await server.start();
    console.log("Server running at:", server.info.uri);
  } catch (err) {
    console.log(err);
  }
})();

/// note that if the server doesnt start because of missing dlls
/// copy and paste the contents of node_modules/@tensorflow/tfjs-node/deps/lib
/// into node_modules/@tensorflow/tfjs-node/lib/napi-v8
/// idk why but it just works.
