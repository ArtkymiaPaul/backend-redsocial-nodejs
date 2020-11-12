'use strict'

//const path = require('path');
//const fs = require('fs');
const mongoosePaginate = require('mongoose-pagination');
let User = require('../models/user');
let Follow = require('../models/follow');

function saveFollow(req, res){
    const params = req.body;
    let follow = new Follow();
    follow.user = req.user.sub;
    follow.followed = params.followed;

    follow.save((err, followStored) =>{
        if(err) return res.status(500).send({message:"Error al guardar el seguimiento"});
        if(!followStored) return res.status(404).send({message:"El seguimiento no se ha guardado"});
        return res.status(200).send({follow:followStored});
    }); 
}

function deleteFollow(req, res){
    const userId = req.user.sub;
    const followId = req.params.id;

    Follow.find({'user':userId, 'followed': followId}).remove(err => {
        if(err) return res.status(500).send({message:"Error al dejar de seguir"});

        return res.status(200).send({message:"El follow se ha eliminado"});
    });


}

function getFollowingUsers(req,res){
    let userId = req.user.sub;
    let page = 1;
    let itemsPerPage = 4;
    if(req.params.id && req.params.page){
        userId = req.params.id;
    }
    if(req.params.page){
        page = req.params.page;
    }else{
        page = req.params.id;
    }

    Follow.find({user:userId}).populate({path:'followed'}).paginate(page,itemsPerPage,(err, follows, total) =>{
        if(err) return res.status(500).send({message:"Error en el servidor"});

        if(!follows) res.status(404).send({message:"No estas siguiendo ningun usuario"});

        followUserIds(req.user.sub).then((value)=>{
            return res.status(200).send({
                total:total,
                pages: Math.ceil(total,itemsPerPage),
                follows,
                users_following: value.following,
                users_follow_me: value.followed,
            });
        });
    });
}

function getFollowedUsers(req, res){
    let userId = req.user.sub;
    let page = 1;
    let itemsPerPage = 4;
    if(req.params.id && req.params.page){
        userId = req.params.id;
    }
    if(req.params.page){
        page = req.params.page;
    }else{
        page = req.params.id;
    }

    Follow.find({followed:userId}).populate('user').paginate(page,itemsPerPage,(err, follows, total) =>{
        if(err) return res.status(500).send({message:"Error en el servidor"});

        if(!follows) res.status(404).send({message:"No te sigue ningun usuario"});

        followUserIds(req.user.sub).then((value)=>{
            return res.status(200).send({
                total:total,
                pages: Math.ceil(total,itemsPerPage),
                follows,
                users_following: value.following,
                users_follow_me: value.followed,
            });
        });
    });
}

//Devolver usuarios que sigo o devolver los usuarios que me siguen
function getMyFollows(req, res){
    const userId = req.user.sub;
    
    let find = Follow.find({user: userId});

    if(req.params.followed){
        find = Follow.find({followed: userId});
    }

    find.populate('user followed').exec((err, follows) =>{
        if(err) return res.status(500).send({message:"Error en el servidor"});

        if(!follows) res.status(404).send({message:"No sigues ningun usuario"});

        return res.status(200).send({follows});
    });

}

async function followUserIds(user_id){
    const following = await Follow.find({"user": user_id})
    .select({'_id':0, '__v':0, 'user': 0});

    const followed = await Follow.find({"followed": user_id})
    .select({'_id':0, '__v':0, 'followed': 0});

    //Procesar following ids
    let following_clean = [];

    following.forEach((follow)=>{
        following_clean.push(follow.followed);
    })

    //Procesar followed ids
    let followers_clean = [];

    followed.forEach((follow)=>{
        followers_clean.push(follow.user);
    })

    return {
        following: following_clean,
        followed: followers_clean
    }

 }


module.exports = {
    saveFollow,
    deleteFollow,
    getFollowingUsers,
    getFollowedUsers,
    getMyFollows
}