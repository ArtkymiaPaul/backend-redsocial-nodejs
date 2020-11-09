'use strict'

const path = require('path');
const fs = require('fs');
const moment = require('moment');
const mongoosePaginate = require('mongoose-pagination');
let Publication = require('../models/publication');
let User = require('../models/user');
let Follow = require('../models/follow');

function probando(req,res){
    res.status(200).send({
        message:"Hola desde el controlador de publicaciones"
    });
}

function savePublication(req,res){
    const params = req.body;
    const publication = new Publication();
    if(!params.text){
        return res.status(200).send({message:"Debes enviar un texto"});
    }    

    publication.text = params.text;
    publication.file = null;
    publication.user = req.user.sub;
    publication.created_at = moment().unix();

    publication.save((err, publicationStored) =>{
        if(err) return res.status(500).send({message:"Error al guardar la publicacion"});
        if(!publicationStored) return res.status(404).send({message:"La publicacion no ha sido guardada"});

        return res.status(200).send({publication:publicationStored});
    });
}

function getPublications(req,res){
    let page = 1;
    const itemsPerPage = 4;
    if(req.params.page){
        page = req.params.page;
    }

    Follow.find({user: req.user.sub}).populate('followed')
    .exec((err, follows)=>{
        if(err) return res.status(500).send({message:"Error al devolver el seguimiento"});
        const follows_clean = [];

        follows.forEach((follow)=>{
            follows_clean.push(follow.followed);
        });

        Publication.find({user:{"$in": follows_clean}}).sort('-created_at').populate('user')
        .paginate(page, itemsPerPage, (err, publications, total)=>{
            if(err) return res.status(500).send({message:"Error al obtener publicaciones"});
            if(!publications) return res.status(404).send({message:"No hay publicaciones"});

            return res.status(200).send({
                total_items:total,
                pages: Math.ceil(total/itemsPerPage),
                page,
                publications
            });
        });
    });
}

function getPublication(req,res){
    const publicationId = req.params.id;

    Publication.findById(publicationId, (err, publication) =>{
        if(err) return res.status(500).send({message:"Error al obtener publicaciones"});
        if(!publication) return res.status(404).send({message:"No existe la publicacion"});

        return res.status(200).send({publication});
    });
}


function deletePublication(req,res){
    const publicationId = req.params.id;

    Publication.find({'user': req.user.sub, '_id': publicationId}).remove((err) =>{
        if(err) return res.status(500).send({message:"Error al borrar publicacion"});
        //if(!publicationRemoved) return res.status(404).send({message:"No se ha borrado la publicacion"});

        return res.status(200).send({message: "Publicacion eliminada correctamente"});
    });
}

//Subir archivos de imagen/publicaciones
function uploadImage(req,res){
    const publicationId = req.params.id;



    if(req.files){
        const file_path = req.files.image.path;
        const file_split = file_path.split('\\');
        const file_name = file_split[2];
        const ext_split = file_name.split('\.');
        const file_ext = ext_split[1];


        if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif'){
            
            Publication.find({'user':req.user.sub, '_id':publicationId})
            .exec((err, publication) =>{
                if(publication && publication.length > 0){
                    //Actualizar documento de la publicacion
                    Publication.findByIdAndUpdate(publicationId,{file: file_name}, {new:true}, (err, publicationUpdate) =>{
                        if(err) return res.status(500).send({message:"Error en la peticion"});

                        if(!publicationUpdate) return res.status(404).send({message:"No se ha podido actualizar la publicacion"});
                
                        return res.status(200).send({publication:publicationUpdate});
                    });
                }else{
                    return removeFilesOfUpload(res,file_path, 'No tienes permiso para actualizar esta publicación');
                }
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
    const path_file = `./uploads/publications/${image_file}`;

    fs.exists(path_file, (exists)=>{
        if(exists){
            res.sendFile(path.resolve(path_file));
        }else{
            res.status(200).send({message: "No existe la imagen..."});
        }
    });
}

module.exports = {
    probando,
    savePublication,
    getPublications,
    getPublication,
    deletePublication,
    uploadImage,
    getImageFile
}
