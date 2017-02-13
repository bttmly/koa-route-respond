
'use strict';

/**
 * Module dependencies.
 */

const pathToRegexp = require('path-to-regexp');
const debug = require('debug')('koa-route');
const methods = require('methods');
const R = require('response-objects');
const pTry = require('p-try');
const { respond } = require('koa-detour-addons');

methods.forEach(function (method) {
  exports[method] = create(method);
});

exports.del = exports.delete;
exports.all = create();

const respondThen = respond.makeRespondSuccess({ responder });
const respondCatch = respond.makeRespondError({ responder });

function create (method) {
  if (method) method = method.toUpperCase();

  return function (path, fn, opts) {
    const keys = [];
    const re = pathToRegexp(path, keys, opts);
    debug('%s %s -> %s', method || 'ALL', path, re);

    function createRoute (routeFn) {
      return function (ctx, next) {
        // method
        if (!matches(ctx, method)) return next();

        const params = getParams(re, ctx.path);
        if (params) {
          ctx.routePath = path;
          debug('%s %s matches %s %j', ctx.method, path, ctx.path, params);
          return pTry(() => routeFn.call(ctx, ctx, params))
            .then(result => respondThen(ctx, result))
            .catch(err => respondCatch(ctx, err));
        }

        // miss
        return next();
      };
    }

    return fn ? createRoute(fn) : createRoute;
  }
}

function decodeParam (val) {
  if (val == null) return val;
  try {
    return decodeURIComponent(val);
  } catch (err) {
    // is there really any other type of error that could come out here?
    if (err instanceof URIError) {
      err.message = `Failed to decode param '${val}'`;
      err.status = err.statusCode = 400;
    }
    throw err;
  }
}

function defaultResponder (resp, ctx) {
  ctx.body = resp.body;
  ctx.status = resp.status;
  Object.keys(resp.headers).forEach(function (h) {
    ctx.set(h, resp.headers[h]);
  });
}

let _responder;
exports.setResponder = r => { _responder = r; };

// a little bit of indirection so we can set the responder
// after installing routes into the application
function responder (resp, ctx) {
  return _responder ?
    _responder(resp, ctx) :
    defaultResponder(resp, ctx);
}

function matches(ctx, method) {
  if (!method) return true;
  if (ctx.method === method) return true;
  if (method === 'GET' && ctx.method === 'HEAD') return true;
  return false;
}

function getParams (re, path) {
  const matches = re.exec(path);

  if (matches == null) {
    return null;
  }

  const {keys} = re;
  return matches.slice(1).reduce((params, match, index) => {
    params[keys[index].name] = decodeParam(match);
    return params;
  }, {});
}
