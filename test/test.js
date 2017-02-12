
'use strict';

const expect = require("expect");
const request = require('supertest');
const Koa = require('koa');
const R = require('response-objects');

const methods = require('methods').map(function(method){
  // normalize method names for tests
  if (method == 'delete') method = 'del';
  if (method == 'connect') return; // WTF
  return method;
}).filter(Boolean)

const route = require('..');

methods.forEach(function(method){
  const app = new Koa();
  app.use(route[method]('/:user(tj)', function(ctx, params){
    return R.Ok(params.user);
  }))

  describe('route.' + method + '()', function(){
    describe('when method and path match', function(){
      it('should 200', function(done){
        request(app.listen())
        [method]('/tj')
        .expect(200)
        .expect(method === 'head' ? '' : 'tj', done);
      })
    })

    describe('when only method matches', function(){
      it('should 404', function(done){
        request(app.listen())
        [method]('/tjayyyy')
        .expect(404, done);
      })
    })

    describe('when only path matches', function(){
      it('should 404', function(done){
        request(app.listen())
        [method === 'get' ? 'post' : 'get']('/tj')
        .expect(404, done);
      })
    })
  })
})

methods.forEach(function(method){
  const app = new Koa();
  app.use(route[method]('/:user(tj)')(function(ctx, {user}){
    return R.Ok(user);
  }))

  describe('composed: route.' + method + '()', function(){
    describe('when method and path match', function(){
      it('should 200', function(done){
        request(app.listen())
        [method]('/tj')
        .expect(200)
        .expect(method === 'head' ? '' : 'tj', done);
      })
    })

    describe('composed: when only method matches', function(){
      it('should 404', function(done){
        request(app.listen())
        [method]('/tjayyyy')
        .expect(404, done);
      })
    })

    describe('composed: when only path matches', function(){
      it('should 404', function(done){
        request(app.listen())
        [method === 'get' ? 'post' : 'get']('/tj')
        .expect(404, done);
      })
    })
  })
})


describe('route.all()', function(){
  describe('should work with', function(){
    methods.forEach(function(method){
      const app = new Koa();
      app.use(route.all('/:user(tj)', function(ctx, {user}){
        return R.Ok(user);
      }))

      it(method, function(done){
        request(app.listen())
        [method]('/tj')
        .expect(200)
        .expect(method === 'head' ? '' : 'tj', done);
      })
    })
  })

  describe('when patch does not match', function(){
    it('should 404', function (done){
      const app = new Koa();
      app.use(route.all('/:user(tj)', function(ctx, {user}){
        return R.Ok(user);
      }))

      request(app.listen())
      .get('/tjayyyyyy')
      .expect(404, done);
    })
  })
})

describe('route params', function(){
  methods.forEach(function(method){
    const app = new Koa();

    // app.use(route[method]('/:user(tj)', function(ctx, {user}, next) {
    //   return next();
    // }))
    //
    // app.use(route[method]('/:user(tj)', function (ctx, {user}, next) {
    //   return R.Ok(user);
    // }))

    app.use(route[method]('/:user(tj)', function (ctx, {user}, next) {
      return R.Created('tj');
    }))

    it('should work with method ' + method, function (done) {
      request(app.listen())
        [method]('/tj')
        .expect(201)
        .expect(method === 'head' ? '' : 'tj', done);
    })
  })

  it('should work with method head when get is defined', function (done) {
    const app = new Koa();

    app.use(route.get('/tj', function (ctx, {name}) {
      return R.Ok('foo')
    }));

    request(app.listen())
    ['head']('/tj')
    .expect(200, done)
  })

  it('should be decoded', function (done) {
    const app = new Koa();

    app.use(route.get('/package/:name', function (ctx, {name}) {
      expect(name).toBe('http://github.com/component/tip');
      done();
    }));

    request(app.listen())
    .get('/package/' + encodeURIComponent('http://github.com/component/tip'))
    .end(function () {});
  })

  it('should be null if not matched', function (done) {
    const app = new Koa();

    app.use(route.get('/api/:resource/:id?', function (ctx, {resource, id}) {
      expect(resource).toBe('users');
      expect(id).toNotExist();
      done();
    }));

    request(app.listen())
    .get('/api/users')
    .end(function(){});
  })

  it('should use the given options', function (done) {
    const app = new Koa();

    app.use(route.get('/api/:resource/:id', function (ctx, {resource, id}) {
      expect(resource).toBe('users');
      expect(id).toBe('1')
      done();
    }, { end: false }));

    request(app.listen())
      .get('/api/users/1/posts')
      .end(function(){});
  })
})

describe('routePath is added to ctx', function(){
  it('when route match', function(done){
    const app = new Koa();

    app.use(route.get('/tj/:var', function (ctx, name){
      expect(ctx.routePath).toEqual('/tj/:var');
      done();
    }));

    request(app.listen())
      .get('/tj/val')
      .end(function(){});
  })
})
