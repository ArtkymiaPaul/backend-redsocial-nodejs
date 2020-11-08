'use strict'

let mongoose = require('mongoose');
let app = require('./app');
let port = 3800;

//COnexion Database
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/redsocial_angular',{useNewUrlParser:true, useUnifiedTopology: true})
.then(() => {
    console.log('La conexion a la base de datos se ha realizado correctamente')
    //Crear servidor
    app.listen(port,() => {
        console.log(`Servidor corriendo en http://localhost:${port}`);
    })
})
.catch(err => console.log(err));