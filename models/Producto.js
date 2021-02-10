const moongose = require("mongoose");

const ProductosSchema = moongose.Schema({
nombre:{
type: String,
require: true,
trim:true
},
existencia:{
    type:Number,
    requiere:true
},
precio:{
type:Number,
requiere:true,
trim:true
},
creado:{

    type: Date,
    default: Date.now()
}
  } )

  ProductosSchema.index({nombre: 'text'})

module.exports = moongose.model('Producto',ProductosSchema)