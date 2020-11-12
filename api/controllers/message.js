'use strict'

const moment = require('moment');
const mongoosePaginate = require('mongoose-pagination');
let User = require('../models/user');
let Follow = require('../models/follow');
let Message = require('../models/message');

function probando(req,res){
    res.status(200).send({message:"Hola desde controlador Message"});
}

function saveMessage(req,res){
    const params = req.body;
    const message = new Message();

    if(!params.text || !params.receiver){
        res.status(200).send({message:"Envia los datos necesarios"});
    }

    message.emitter = req.user.sub;
    message.receiver = params.receiver;
    message.text = params.text;
    message.created_at = moment().unix();
    message.viewed = 'false';

    message.save((err, messageStored) =>{
        if(err) return res.status(500).send({message:"Error en la peticion"});
        if(!messageStored) return res.status(500).send({message:"Error al enviar el mensage"});

        res.status(200).send({message: messageStored});
    });

}

function getReceivedMessages(req,res){
    const userId = req.user.sub;
    const page = req.params.page ?req.params.page:1;
    const itemsPerPage = 4;
    
    Message.find({receiver: userId})
    .populate('emitter','name surname _id nick image').sort('-created_at')
    .paginate(page,itemsPerPage,(err, messages, total) =>{
        if(err) return res.status(500).send({message:"Error en la peticion"});
        if(!messages) return res.status(500).send({message:"No hay mensajes"});
        res.status(200).send({
            total,
            pages: Math.ceil(total/itemsPerPage),
            messages
        });
    });
}

function getEmittMessages(req,res){
    const userId = req.user.sub;
    const page = req.params.page ?req.params.page:1;
    const itemsPerPage = 4;
    
    Message.find({emitter: userId})
    .populate('emitter receiver','name surname _id nick image').sort('-created_at')
    .paginate(page,itemsPerPage,(err, messages, total) =>{
        if(err) return res.status(500).send({message:"Error en la peticion"});
        if(!messages) return res.status(500).send({message:"No hay mensajes"});
        return res.status(200).send({
            total,
            pages: Math.ceil(total/itemsPerPage),
            messages
        });
    });
}

function getUnviewedMessages(req,res){
    const userId = req.user.sub;

    Message.count({receiver:userId, viewed:'false'})
    .exec((err,count)=>{
        if(err) return res.status(500).send({message:"Error en la peticion"});
        //if(!count) return res.status(500).send({message:"No hay mensajes"});
        return res.status(200).send({
            'unviewed':count
        });
    });
}

function setViewedMessages(req,res){
    const userId = req.user.sub;
    
    Message.update({receiver:userId, viewed:'false'}, 
    {viewed:'true'}, {multi:true},
    (err, messageUpdate) =>{
        if(err) return res.status(500).send({message:"Error en la peticion"});
        if(!messageUpdate) return res.status(404).send({message:"No se ha podido cambiar el estado del mensaje"});
        return res.status(200).send({
            messages:messageUpdate
        });
    }
    );
}

module.exports = {
    probando,
    saveMessage,
    getReceivedMessages,
    getEmittMessages,
    getUnviewedMessages,
    setViewedMessages
}


