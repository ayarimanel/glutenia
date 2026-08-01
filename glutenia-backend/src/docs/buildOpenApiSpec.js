const path = require("path");
const { parseRouteFile } = require("./parseRoutes");

// Mirrors the `app.use(prefix, xRoutes)` mounting table in src/app.js.
const ROUTE_FILES = [
  { file: "auth.routes.js", prefix: "/api/auth", tag: "Auth" },
  { file: "communityProduct.routes.js", prefix: "/api/community-products", tag: "Community Products" },
  { file: "establishment.routes.js", prefix: "/api/establishments", tag: "Establishments" },
  { file: "event.routes.js", prefix: "/api/events", tag: "Events" },
  { file: "gamification.routes.js", prefix: "/api/gamification", tag: "Gamification" },
  { file: "notification.routes.js", prefix: "/api/notifications", tag: "Notifications" },
  { file: "onboarding.routes.js", prefix: "/api/onboarding", tag: "Onboarding" },
  { file: "order.routes.js", prefix: "/api/orders", tag: "Orders" },
  { file: "patientResource.routes.js", prefix: "/api/patient-resources", tag: "Patient Resources" },
  { file: "product.routes.js", prefix: "/api/products", tag: "Products" },
  { file: "professional.routes.js", prefix: "/api/professionals", tag: "Professionals" },
  { file: "recipe.routes.js", prefix: "/api/recipes", tag: "Recipes" },
  { file: "scan.routes.js", prefix: "/api/scan", tag: "Scan" },
  { file: "user.routes.js", prefix: "/api/users", tag: "Users" },
];

const ROUTES_DIR = path.join(__dirname, "..", "routes");

function toOpenApiPath(prefix, routePath) {
  const full = routePath === "/" ? prefix : `${prefix}${routePath}`;
  return full.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
}

function successStatus(method, handlerName) {
  if (method === "post" && /^(create|register|submit)/i.test(handlerName)) return "201";
  return "200";
}

const genericSuccessSchema = {
  type: "object",
  properties: {
    success: { type: "boolean", example: true },
    data: { type: "object", description: "Response payload — shape varies per endpoint; see the controller for exact fields.", additionalProperties: true },
  },
};

const genericErrorSchema = {
  type: "object",
  properties: {
    success: { type: "boolean", example: false },
    message: { type: "string" },
  },
};

function buildParameters(route) {
  const parameters = [];
  for (const p of route.params) {
    parameters.push({
      name: p.field,
      in: "path",
      required: true, // Express requires all declared path segments regardless of validator presence
      schema: p.schema,
      description: p.schema.description,
    });
  }
  for (const q of route.query) {
    parameters.push({
      name: q.field,
      in: "query",
      required: q.required,
      schema: q.schema,
      description: q.schema.description,
    });
  }
  return parameters;
}

function buildRequestBody(route) {
  if (route.upload) {
    return {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              [route.upload.field]: {
                type: "string",
                format: "binary",
                description: "Image file (multipart upload, handled by multer, max 5MB)",
              },
            },
            required: [route.upload.field],
          },
        },
      },
    };
  }
  if (route.bodySchema) {
    return {
      required: route.bodySchema.required.length > 0,
      content: { "application/json": { schema: route.bodySchema } },
    };
  }
  return undefined;
}

function buildResponses(route) {
  const responses = {};
  const status = successStatus(route.method, route.handlerName);
  responses[status] = {
    description: "Success",
    content: { "application/json": { schema: genericSuccessSchema } },
  };
  if (route.hasValidateRequest) {
    responses["400"] = {
      description: "Validation error",
      content: { "application/json": { schema: genericErrorSchema } },
    };
  }
  if (route.auth.required) {
    responses["401"] = {
      description: "Missing or invalid JWT",
      content: { "application/json": { schema: genericErrorSchema } },
    };
  }
  if (route.auth.roles) {
    responses["403"] = {
      description: "Authenticated but not permitted (role check failed)",
      content: { "application/json": { schema: genericErrorSchema } },
    };
  }
  if (route.params.length) {
    responses["404"] = {
      description: "Resource not found (inferred: endpoint takes an id path parameter)",
      content: { "application/json": { schema: genericErrorSchema } },
    };
  }
  responses["500"] = {
    description: "Server error",
    content: { "application/json": { schema: genericErrorSchema } },
  };
  return responses;
}

function buildOpenApiSpec() {
  const paths = {};
  const coverage = { totalRoutes: 0, filesParsed: 0, warnings: [] };

  for (const { file, prefix, tag } of ROUTE_FILES) {
    let routes;
    try {
      routes = parseRouteFile(path.join(ROUTES_DIR, file));
    } catch (err) {
      coverage.warnings.push({ file, message: `Failed to parse file: ${err.message}` });
      continue;
    }
    coverage.filesParsed += 1;

    for (const route of routes) {
      coverage.totalRoutes += 1;
      const openApiPath = toOpenApiPath(prefix, route.routePath);
      paths[openApiPath] = paths[openApiPath] || {};

      if (route.warnings.length) {
        coverage.warnings.push({
          file,
          route: `${route.method.toUpperCase()} ${openApiPath}`,
          messages: route.warnings,
        });
      }

      const operation = {
        tags: [tag],
        summary: route.summary,
        operationId: `${tag.replace(/\s+/g, "")}_${route.handlerName}`,
        parameters: buildParameters(route),
        responses: buildResponses(route),
      };

      const requestBody = buildRequestBody(route);
      if (requestBody) operation.requestBody = requestBody;

      if (route.auth.required) {
        operation.security = [{ bearerAuth: [] }];
      } else if (route.auth.optional) {
        operation.security = [{ bearerAuth: [] }, {}];
        operation.description =
          "Authentication optional: send a Bearer token to personalize the response, or omit it for the public view.";
      }

      paths[openApiPath][route.method] = operation;
    }
  }

  const tags = ROUTE_FILES.map(({ tag }) => ({ name: tag }));

  const spec = {
    openapi: "3.0.3",
    info: {
      title: "Glutenia API",
      version: "1.0.0",
      description:
        "Auto-generated from the Express routes, express-validator chains, and auth middleware in src/routes/*.js. " +
        "Response bodies are documented as a generic {success, data} / {success, message} envelope — exact field-level " +
        "shapes are not derived from validators and should be cross-checked against the relevant controller.",
    },
    servers: [{ url: "/", description: "Current server (relative — works against whichever host/port is serving this page)" }],
    tags,
    paths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Obtain a token from POST /api/auth/login or /api/auth/register, then click Authorize and paste it here.",
        },
      },
    },
  };

  return { spec, coverage };
}

module.exports = { buildOpenApiSpec, ROUTE_FILES };
