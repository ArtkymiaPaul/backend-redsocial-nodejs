'use strict'

const express = require('express');
const bodyParser = require('body-parser');

let app = express();

//cargar rutas
app.get('/', (req,res) =>{
    res.status(200).send({
        message:"Hola Mundo desde el servidor NodeJS"
    });
});
app.get('/pruebas', (req,res) =>{
    res.status(200).send({
        message:"Accion de pruebas"
    });
});

//middlewares
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

//cors

//rutas

//exportar
module.exports = app;