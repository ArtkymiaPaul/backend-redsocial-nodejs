'use strict'

const express = require('express');
const bodyParser = require('body-parser');

let app = express();

//cargar rutas
const user_routes = require('./routes/user');
const follow_routes = require('./routes/follow');

//middlewares
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

//cors

//rutas
app.use('/api',user_routes);
app.use('/api',follow_routes);

//exportar
module.exports = app;