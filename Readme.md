# koa-route

 Route middleware for Koa with [response object](https://github.com/nickb1080/response-objects) support.

```js
const r = require('koa-route-respond');
app.use(r.get('/pets', pets.list));
app.use(r.get('/pets/:name', pets.show));
```

## Installation

```
$ npm install koa-route-respond
```

## Example

  Contrived resource-oriented example:

```js
const r = require('koa-route');
const { Ok, NotFound } = require('response-objects');
const Koa = require('koa');
const app = new Koa();

const db = {
  tobi: { name: 'tobi', species: 'ferret' },
  loki: { name: 'loki', species: 'ferret' },
  jane: { name: 'jane', species: 'ferret' },
};

const pets = {
  list (ctx) {
    const names = Object.keys(db);
    return Ok(`pets: ${names.join(', ')}`);
  },

  show (ctx, {name}) {
    const pet = db[name];
    if (!pet) throw NotFound('cannot find that pet');
    return Ok(`${pet.name} is a ${pet.species}`);
  },
};

app.use(r.get('/pets', pets.list));
app.use(r.get('/pets/:name', pets.show));
app.listen(3000);
```

## License

  MIT
