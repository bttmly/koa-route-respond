'use strict';

const { get } = require('./');
const { Ok, NotFound } = require('response-objects');

const Koa = require('koa');
const app = new Koa();

const db = {
  tobi: { name: 'tobi', species: 'ferret' },
  loki: { name: 'loki', species: 'ferret' },
  jane: { name: 'jane', species: 'ferret' }
};

const pets = {
  list (ctx) {
    const names = Object.keys(db);
    return Ok(`pets: ${names.joing(', ')}`);
  },

  show (ctx, {name}) {
    const pet = db[name];
    if (!pet) throw NotFound('cannot find that pet');
    return Ok(`${pet.name} is a ${pet.species}`);
  }
};

app.use(get('/pets', pets.list));
app.use(get('/pets/:name', pets.show));
app.listen(3000);
