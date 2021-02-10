const moongose = require("mongoose");

const UsuariosSchema = moongose.Schema({
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
email:{

    type: String,
    require: true,
    trim:true,
    unique: true
},
password:{

    type: String,
    require: true,
    trim:true
},
creado:{

    type: Date,
    default: Date.now()
}

})
module.exports = moongose.model('Usuario',UsuariosSchema)