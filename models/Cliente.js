const moongose = require("mongoose");

const ClientesSchema = moongose.Schema({
nombre:{
    type: String,
    require: true,
    trim:true
},
apellido:{
    type: String,
    require: true,
    trim:true
    },
empresa:{
    type: String,
    require: true,
    trim:true
    },
email:{
    type: String,
    require: true,
    trim:true,
    unique:true// con esto no abra clientes repetidos
    },
telefono:{
    type: String,
    trim:true,
    },
creado:{
    type: Date,
    default:Date.now(),
    },
vendedor:{
    type: moongose.Schema.Types.ObjectId,// nos combierte el tipo de dato en un objeto
    requiere: true,
    ref: 'Usuario'//Guarda el ObjectId y sabe donde esta la referencia
    },




})
module.exports = moongose.model('Cliente',ClientesSchema)