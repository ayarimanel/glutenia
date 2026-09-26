const fs = require("fs");
const acorn = require("acorn");

const HTTP_METHODS = ["get", "post", "put", "delete", "patch"];
const VALIDATOR_ROOTS = ["body", "param", "query", "check"];

// Collects `const NAME = [...]`, `const NAME = (arg) => body(arg)....`, and
// `const NAME = multer({...})` top-level declarations so route handlers that
// reference them by identifier (e.g. `idValidator`, `phoneValidator("phone")`,
// `upload.single("image")`) can be resolved back to their real definition.
function buildTopLevelScope(programBody) {
  const arrays = new Map(); // name -> ArrayExpression node
  const factories = new Map(); // name -> { chainNode } (arrow fn wrapping a body/param/query chain)
  const multerVars = new Set(); // names assigned from multer({...})

  for (const stmt of programBody) {
    if (stmt.type !== "VariableDeclaration") continue;
    for (const decl of stmt.declarations) {
      if (!decl.init || decl.id.type !== "Identifier") continue;
      const name = decl.id.name;

      if (decl.init.type === "ArrayExpression") {
        arrays.set(name, decl.init);
        continue;
      }

      if (
        decl.init.type === "CallExpression" &&
        decl.init.callee.type === "Identifier" &&
        decl.init.callee.name === "multer"
      ) {
        multerVars.add(name);
        continue;
      }

      if (
        decl.init.type === "ArrowFunctionExpression" &&
        decl.init.params.length === 1 &&
        decl.init.params[0].type === "Identifier"
      ) {
        const paramName = decl.init.params[0].name;
        let body = decl.init.body;
        if (body.type === "BlockStatement") {
          const ret = body.body.find((s) => s.type === "ReturnStatement");
          body = ret ? ret.argument : null;
        }
        if (body && body.type === "CallExpression") {
          let cur = body;
          while (cur.type === "CallExpression" && cur.callee.type === "MemberExpression") {
            cur = cur.callee.object;
          }
          if (
            cur.type === "CallExpression" &&
            cur.callee.type === "Identifier" &&
            VALIDATOR_ROOTS.includes(cur.callee.name) &&
            cur.arguments[0] &&
            cur.arguments[0].type === "Identifier" &&
            cur.arguments[0].name === paramName
          ) {
            factories.set(name, { chainNode: body });
          }
        }
      }
    }
  }

  return { arrays, factories, multerVars };
}

function literalValue(node) {
  return node && (node.type === "Literal" || node.type === "StringLiteral") ? node.value : undefined;
}

function resolveEnum(node, scope) {
  let target = node;
  if (node.type === "Identifier") {
    target = scope.arrays.get(node.name);
  }
  if (!target || target.type !== "ArrayExpression") return null;
  const values = target.elements.map(literalValue).filter((v) => v !== undefined);
  return values.length ? values : null;
}

function applyOptionsArg(argNode, schema, kind) {
  if (!argNode || argNode.type !== "ObjectExpression") return;
  for (const prop of argNode.properties) {
    if (prop.type !== "Property" || prop.key.type !== "Identifier") continue;
    const val = literalValue(prop.value);
    if (val === undefined) continue;
    if (prop.key.name === "min") {
      if (kind === "length") schema.minLength = val;
      else if (kind === "items") schema.minItems = val;
      else schema.minimum = val;
    } else if (prop.key.name === "max") {
      if (kind === "length") schema.maxLength = val;
      else if (kind === "items") schema.maxItems = val;
      else schema.maximum = val;
    }
  }
}

function appendDescription(schema, text) {
  schema.description = schema.description ? `${schema.description}; ${text}` : text;
}

// Walks a chain like body("email").isEmail().withMessage(...).normalizeEmail(...)
// back down to its root call, collecting the `.method(args)` calls in source order.
function parseValidatorChain(chainNode, scope, warnings, overrideField) {
  const calls = [];
  let cur = chainNode;
  while (cur.type === "CallExpression" && cur.callee.type === "MemberExpression") {
    calls.unshift({ name: cur.callee.property.name, args: cur.arguments });
    cur = cur.callee.object;
  }

  if (cur.type !== "CallExpression" || cur.callee.type !== "Identifier" || !VALIDATOR_ROOTS.includes(cur.callee.name)) {
    warnings.push("Could not resolve a validator chain root (not a body()/param()/query()/check() call)");
    return null;
  }

  const location = cur.callee.name === "check" ? "body" : cur.callee.name;
  const field = overrideField !== undefined ? overrideField : literalValue(cur.arguments[0]);
  if (field === undefined) {
    warnings.push(`Validator field name is not a string literal (dynamic field on ${location}())`);
    return null;
  }

  const schema = { type: "string" };
  let required = true;
  let enumVals = null;

  for (const call of calls) {
    switch (call.name) {
      case "optional":
        required = false;
        break;
      case "isEmail":
        schema.format = "email";
        break;
      case "isBoolean":
        schema.type = "boolean";
        break;
      case "isInt":
        schema.type = "integer";
        applyOptionsArg(call.args[0], schema, "range");
        break;
      case "isFloat":
        schema.type = "number";
        applyOptionsArg(call.args[0], schema, "range");
        break;
      case "isArray":
        schema.type = "array";
        schema.items = schema.items || {};
        applyOptionsArg(call.args[0], schema, "items");
        break;
      case "isMongoId":
        schema.type = "string";
        appendDescription(schema, "MongoDB ObjectId");
        break;
      case "isISO8601":
        schema.type = "string";
        schema.format = "date-time";
        break;
      case "isLength":
        applyOptionsArg(call.args[0], schema, "length");
        break;
      case "isString":
        schema.type = "string";
        break;
      case "isIn":
        enumVals = resolveEnum(call.args[0], scope);
        break;
      case "custom":
        appendDescription(schema, "custom validation applied");
        break;
      case "matches":
        appendDescription(schema, "must match a required pattern");
        break;
      default:
        break; // trim, toInt, toFloat, toBoolean, toDate, normalizeEmail, withMessage, notEmpty, exists — no schema effect
    }
  }

  if (enumVals) schema.enum = enumVals;
  return { location, field, required, schema };
}

// Expands dotted/wildcard field paths like "items.*.qty" or "address.city"
// into a nested JSON schema instead of leaving them as flat opaque strings.
function setNestedProperty(rootSchema, path, entry) {
  const segments = path.split(".");
  let node = rootSchema;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const isLast = i === segments.length - 1;
    if (seg === "*") {
      node.type = "array";
      node.items = node.items || { type: "object", properties: {}, required: [] };
      node = node.items;
      continue;
    }
    node.type = node.type || "object";
    node.properties = node.properties || {};
    node.required = node.required || [];
    if (isLast) {
      node.properties[seg] = { ...entry.schema };
      if (entry.required && !node.required.includes(seg)) node.required.push(seg);
    } else {
      node.properties[seg] = node.properties[seg] || { type: "object", properties: {}, required: [] };
      node = node.properties[seg];
    }
  }
}

function collectValidatorEntries(arrayNode, scope, warnings) {
  const entries = [];
  for (const el of arrayNode.elements) {
    if (!el) continue;
    if (el.type === "CallExpression" && el.callee.type === "Identifier" && scope.factories.has(el.callee.name)) {
      const { chainNode } = scope.factories.get(el.callee.name);
      const literalField = literalValue(el.arguments[0]);
      const parsed = literalField !== undefined ? parseValidatorChain(chainNode, scope, warnings, literalField) : null;
      if (parsed) {
        entries.push(parsed);
      } else {
        warnings.push(`Could not resolve factory call ${el.callee.name}(...)`);
      }
      continue;
    }
    if (el.type === "CallExpression") {
      const parsed = parseValidatorChain(el, scope, warnings);
      if (parsed) entries.push(parsed);
      continue;
    }
    warnings.push(`Unrecognized validator array element of type ${el.type}`);
  }
  return entries;
}

function humanizeName(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

// Parses one Express route file's source and returns a normalized list of
// route descriptors: { method, path, params, query, bodySchema, upload,
// auth, handlerName, warnings }.
function parseRouteFile(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const ast = acorn.parse(source, { ecmaVersion: 2022, sourceType: "script" });
  const scope = buildTopLevelScope(ast.body);
  const routes = [];

  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (
      node.type === "CallExpression" &&
      node.callee.type === "MemberExpression" &&
      node.callee.object.type === "Identifier" &&
      node.callee.object.name === "router" &&
      node.callee.property.type === "Identifier" &&
      HTTP_METHODS.includes(node.callee.property.name)
    ) {
      routes.push(parseRouteCall(node, scope));
      return; // don't descend into the route call's own children again
    }
    for (const key of Object.keys(node)) {
      if (key === "type" || key === "start" || key === "end" || key === "loc") continue;
      const val = node[key];
      if (val && typeof val === "object") visit(val);
    }
  };

  visit(ast.body);
  return routes;

  function parseRouteCall(node, scope) {
    const warnings = [];
    const method = node.callee.property.name;
    const args = node.arguments;
    const routePath = literalValue(args[0]) ?? "/";
    const middlewareArgs = args.slice(1, -1);
    const handlerArg = args[args.length - 1];

    let handlerName = "handler";
    if (handlerArg) {
      if (handlerArg.type === "MemberExpression" && handlerArg.property.type === "Identifier") {
        handlerName = handlerArg.property.name;
      } else if (handlerArg.type === "Identifier") {
        handlerName = handlerArg.name;
      }
    }

    const params = [];
    const query = [];
    const bodyRoot = { type: "object", properties: {}, required: [] };
    let hasBody = false;
    let upload = null;
    const auth = { required: false, optional: false, roles: null };
    let hasValidateRequest = false;

    const addEntries = (entries) => {
      for (const entry of entries) {
        if (entry.location === "param") {
          params.push(entry);
        } else if (entry.location === "query") {
          query.push(entry);
        } else {
          hasBody = true;
          setNestedProperty(bodyRoot, entry.field, entry);
        }
      }
    };

    for (const arg of middlewareArgs) {
      if (arg.type === "Identifier") {
        if (arg.name === "validateRequest") {
          hasValidateRequest = true;
        } else if (arg.name === "verifyToken") {
          auth.required = true;
        } else if (arg.name === "isAdmin") {
          auth.required = true;
          auth.roles = ["admin"];
        } else if (arg.name === "optionalAuth") {
          auth.optional = true;
        } else if (scope.arrays.has(arg.name)) {
          addEntries(collectValidatorEntries(scope.arrays.get(arg.name), scope, warnings));
        } else {
          warnings.push(`Unrecognized middleware identifier '${arg.name}' — could not classify, ignored`);
        }
      } else if (arg.type === "ArrayExpression") {
        addEntries(collectValidatorEntries(arg, scope, warnings));
      } else if (arg.type === "CallExpression") {
        if (
          arg.callee.type === "Identifier" &&
          arg.callee.name === "requireRole"
        ) {
          auth.required = true;
          auth.roles = arg.arguments.map(literalValue).filter(Boolean);
        } else if (
          arg.callee.type === "MemberExpression" &&
          arg.callee.object.type === "Identifier" &&
          scope.multerVars.has(arg.callee.object.name) &&
          arg.callee.property.name === "single"
        ) {
          upload = { field: literalValue(arg.arguments[0]) || "file" };
        } else {
          warnings.push("Unrecognized inline call in middleware chain — could not classify, ignored");
        }
      } else {
        warnings.push(`Unrecognized middleware argument of type ${arg.type}`);
      }
    }

    if ((params.length || query.length || hasBody) && !hasValidateRequest) {
      warnings.push("Validators present but validateRequest not detected in chain (unexpected)");
    }

    return {
      method,
      routePath,
      params,
      query,
      bodySchema: hasBody ? bodyRoot : null,
      upload,
      auth,
      hasValidateRequest,
      handlerName,
      summary: humanizeName(handlerName),
      warnings,
    };
  }
}

module.exports = { parseRouteFile };
