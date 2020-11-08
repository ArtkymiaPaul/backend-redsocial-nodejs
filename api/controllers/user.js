'use strict'

const bcrypt = require('bcrypt-nodejs');
const mongoosePaginate = require('mongoose-pagination');
const jwt = require('../services/jwt');
const fs = require('fs');
const path = require('path');
let User = require('../models/user');
const { exists } = require('../models/user');


function home(req,res){
    res.status(200).send({
        message:"Hola Mundo desde el servidor NodeJS"
    });
}


function pruebas (req,res){
    res.status(200).send({
        message:"Accion de pruebas"
    });
}

//registro
function saveUser(req, res){
    const params = req.body;
    let user = new User();

    if(params.name && params.surname && 
        params.nick && params.email && params.password){
            user.name = params.name;
            user.surname = params.surname;
            user.nick = params.nick;
            user.email = params.email;
            user.role = 'ROLE_USER';
            user.image = null;

            //Controlar usuarios duplicados
            User.find({ $or: [
                {email:user.email.toLowerCase()},
                {nick:user.nick.toLowerCase()},
            ]
            }).exec((err,users) =>{
                if(err) return res.status(500).send({message:"Error en la peticion de usuario"});

                if(users && users.length >= 1){
                    return res.status(200).send({message:"el usuario que intentas registrar ya existe"});
                }else{
                    //Cifra la password y guarda los datos
                    bcrypt.hash(params.password,null,null,(err,hash) =>{
                        user.password = hash;
                        user.save((err,userStored) => {
                            if(err) return res.status(500).send({message:"Error al guardar el usuario"});

                            if(userStored){
                                res.status(200).send({user:userStored});
                            }
                            else{
                                res.status(400).send({message:"No se ha registrado el usuario"});
                            }
                        })
                    });
                }
            });
            //-----------------------------------------

            
        }else{
            res.status(200).send({
                message: "Envia todos los campos necesario!!!"
            });
        }
}

//Login
function loginUser(req, res){
    const params = req.body;
    let email = params.email;
    let password = params.password;

    User.findOne({email},(err,user)=>{
        if(err) return res.status(500).send({message: "Error en la peticion"});

        if(user){
            bcrypt.compare(password,user.password,(err, check)=>{
                if(check){
                    //devolver datos de usuario
                    
                    if(params.gettoken){
                        //generar y devolver token
                        return res.status(200).send({
                           token: jwt.createToken(user)
                        });
                    }else{
                        //devolver datos de usuario
                        user.password = undefined;
                        return res.status(200).send({user});
                    }
                   
                }else{
                    return res.status(404).send({message:"El usuario no se ha podido identificar"});
                }
            });
        }else{
            return res.status(404).send({message:"El usuario no se ha podido identificar!!"});
        }
    });
}

//Conseguir datos de un usuario
function getUser(req,res){
    const userId = req.params.id;

    User.findById(userId, (err, user) =>{
        if(err) return res.status(500).send({message:"Error en la peticion"});

        if(!user) return res.status(404).send({message:"El usuario no existe"});

        return res.status(200).send({user});
    });
}

//Devolver un listado de usuarios paginado
function getUsers(req, res){
    const identity_user_id = req.user.sub;

    let page = 1;
    if(req.params.page){
        page = req.params.page;
    }

    const itemsPerPage = 5;

    User.find().sort('_id').paginate(page, itemsPerPage, (err, users,total) =>{
        if(err) return res.status(500).send({message:"Error en la peticion"});
        if(!users) return res.status(404).send({message:"No hay usuarios disponibles"});

        return res.status(200).send({
            users,
            total,
            pages: Math.ceil(total/itemsPerPage)
        });
    });    

}

//Edicion de datos de usuario
function updateUser(req,res){
    const userId = req.params.id;
    const update = req.body;

    //borrar propiedad password
    delete update.password;

    if(userId != req.user.sub){
        return res.status(500).send({message:'No tienes permiso para actualizar los datos del usuario'})
    }

    User.findByIdAndUpdate(userId, update,{new:true}, (err, userUpdate) =>{
        if(err) return res.status(500).send({message:"Error en la peticion"});

        if(!userUpdate) return res.status(500).send({message:"No se ha podido actualizar el usuario"});

        return res.status(200).send({user:userUpdate});
    });

}

//Subir archivos de imagen/avatar de usuario
function uploadImage(req,res){
    const userId = req.params.id;



    if(req.files){
        const file_path = req.files.image.path;
        const file_split = file_path.split('\\');
        const file_name = file_split[2];
        const ext_split = file_name.split('\.');
        const file_ext = ext_split[1];


        if(userId != req.user.sub){
            return removeFilesOfUpload(res, file_path,'No tienes permiso para actualizar los datos del usuario');
        }

        if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif'){
            //Actualizar documento de usuario logueado
            User.findByIdAndUpdate(userId,{image: file_name}, {new:true}, (err, userUpdate) =>{
                if(err) return res.status(500).send({message:"Error en la peticion"});

                if(!userUpdate) return res.status(500).send({message:"No se ha podido actualizar el usuario"});
        
                return res.status(200).send({user:userUpdate});
            });
        }else{
            return removeFilesOfUpload(res,file_path, 'extension no es valida');
        }

    }else{
        return res.status(200).send({message:'No se han subido archivos de imagen'});
    }
}

function removeFilesOfUpload(res,file_path, message){
    fs.unlink(file_path, (err)=>{
        return res.status(200).send({message});
    });
}

function getImageFile(req,res){
    const image_file = req.params.imageFile;
    const path_file = `./uploads/users/${image_file}`;

    fs.exists(path_file, (exists)=>{
        if(exists){
            res.sendFile(path.resolve(path_file));
        }else{
            res.status(200).send({message: "No existe la imagen..."});
        }
    });
}

module.exports = {
    home,
    pruebas,
    saveUser,
    loginUser,
    getUser,
    getUsers,
    updateUser,
    uploadImage,
    getImageFile   
}