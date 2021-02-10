const moongose = require("mongoose");

const ProductoSchema = moongose.Schema({
pedido:{
    type: Array,//arreglos
    require: true,
},
total:{
    type: Number,
    requiere: true  
},
cliente:{
    type: moongose.Schema.Types.ObjectId,
    requiere: true,
    ref:'Cliente'
},
vendedor:{
    type: moongose.Schema.Types.ObjectId,
    requiere: true,
    ref:'Usuario'
},
estado:{
    type: String,
    default: "PENDIENTE"
},
creado:{
    type: Date,
    default: Date.now()
}

})
module.exports = moongose.model('Pedido',ProductoSchema)