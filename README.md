[![travis](https://img.shields.io/travis/skonves/openapi-router.svg)](https://travis-ci.org/skonves/openapi-router)
[![coveralls](https://img.shields.io/coveralls/skonves/openapi-router.svg)](https://coveralls.io/github/skonves/openapi-router)
[![npm](https://img.shields.io/npm/v/openapi-router.svg)](https://www.npmjs.com/package/openapi-router)

# OpenAPI Router

Simple router and validator for ExpressJs and OpenAPI 2.0

## Quick Start

1.  Construct a router from an Express `app` and the OpenAPI file.
1.  Add route handlers using the OpenAPI `operationId` and a standard Express handler function.

(Note that all examples use the Pet Store example: http://petstore.swagger.io/v2/swagger.json)

```js
const express = require('express');
const Router = require('openapi-router').Router;
const spec = require('./swagger.json');

const app = express();
const router = new Router(spec, app);

router.use('getPetById', (req, res, next) => {
  // TODO: implement route here
});
```

In this example, `router.use` finds the HTTP method and path from the OpenAPI file (`GET` and `/pet/{petId}`) and these values are used internally to call `app.get('/pet/:petId', handlerFn)`. Additionally, the router validates both the request _and_ response based on the OpenAPI file. (see Validation Errors below)

## Parameters

Validated and type-cast request parameters are accessible on the request from the added 'openapi.params' property:

```js
// GET /pet/:petId
router.use('getPetById', (req, res, next) => {
  // Validated, type-cast value
  console.log(typeof req.openapi.params.petId); // > number

  // Raw value from express params
  console.log(typeof req.params.petId); // > string

  // Implement route here
});
```

Parameters from the query string, path, body, and headers are all aggregated in `req.openapi.params`:

```js
// GET /user/login
router.use('loginUser', (req, res, next) => {
  {
    // Getting values from openapi.params object:
    const username = req.openapi.params.username;
    const password = req.openapi.params.password;
  }

  {
    // Getting values directly from query
    const username = req.query.username;
    const password = req.query.password;
  }

  // Implement route here
});
```

Note: you will still need to run the `body-parser` middleware in order to access body parameters.

## Validation Errors

### Requests

If an incoming request is invalid, validation errors are pushed to the `req.openapi.errors` array and `next()` is called with `{code: 'OPENAPI_ERRORS': scope: 'request'}`.

### Responses

Outgoing responses are also validated and validation errors are pushed to `res.openapi.errors`. The `next()` function is called with `{code: 'OPENAPI_ERRORS': scope: 'response'}`. An `options` parameter can be passed to the Router constructor to control which (if any) types of responses errors are ignored:

* `ignoreInvalidHeaders` - When set to `true`, responses will be returned as-is even if the header values do not validate per the OpenAPI file. Errors _will_ be returned if the header is missing entirely. (Default is `false`)
* `ignoreMissingHeaders` - When set to `true`, responses will be returned as-is even if defined headers are missing. Errors _will_ be returned if the header is present, but invalid. (Default is `false`)
* `ignoreInvalidBody` - When set to `true`, responses will be returned as-is even if the response body does not validate per the OpenAPI file. (Default is `false`)
* `ignoreInvalidStatus` - When set to `true`, responses will be returned as-is even if a response is not defined for the current HTTP status code and no default response is defined. (Default is `false`)

(Setting each values to `true` disables all response validation)

### Error Handler

A convenience error handler is included that returns JsonAPI-style error responses:

```js
const express = require('express');
const errorHandler = require('openapi-router').errorHandler;

const app = express();

// Implement routes here

app.use(errorHandler);
```

## Catch-All Routes

The router exposes a method to add various catch-all routes:

```js
router.addCatchAllRoutes();
```

### Not-implemented routes

Because the router is aware of which routes are defined in the OpenAPI file as well as the routes that have been defined in code, it is able add routes to the Express app that handle operations that have not been implemented with the router.

### Method-not-allowed routes

The router adds a catch all route for each path defined in the OpenAPI file that pushes a Not Implemented error to `req.openapi.errors`.  Calls to the API with an HTTP method not defined in the OpenAPI file fall through to this route and are returned the appropriate error.

### Not-found route
Lastly, the router adds a '*' catch-all route that catches any request to a path not defined in the OpenAPI file.

Please note that any routes defined after these catch-all routes are added will never be hit.  This is true for both routes added via the router as well as routes added directly via the Express `app` object.

## Prior Art
This project is heavily based on:
* Gangplank - https://github.com/DriveTimeInc/gangplank, MIT license
* SwaggerOps - https://github.com/skonves/swagger-ops, MIT license

