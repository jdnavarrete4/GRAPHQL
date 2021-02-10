const Usuario = require("../models/Usuario");
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken');
const Producto = require("../models/Producto");
const Cliente = require("../models/Cliente");
const Pedido = require("../models/Pedido");


require ('dotenv').config({path: 'variables.env'})

const crearToken=(usuario,secreta,expiresIn) =>{
// console.log(usuario);
const {id,email,nombre,apellido}=usuario
return jwt.sign({id,email,nombre,apellido},secreta,{expiresIn})
}


//Resolvers
const resolvers ={
    Query: {
      obtenerUsuario:async (_, {},ctx )=> {
        
        return ctx.usuario
      },
      obtenerProductos: async ()=>{
        try {
          const productos = await Producto.find({})
          return productos
        } catch (error) {
          console.log(error);
        }
        
      },
      obtenerProducto: async (_, {id})=>{
        // revisar si existe el pr
        const producto = await Producto.findById(id);
        if (!producto) {
          throw new Error('Producto no existe')
        }
        return producto
      },
      obtenerClientes: async ()=>{
        try {
          const clientes= await Cliente.find({})
          return clientes
        } catch (error) {
          console.log(error);
        }

      },
      obtenerClienteVendedor: async (_,{},ctx)=>{
        try {
          const clientes= await Cliente.find({vendedor:ctx.usuario.id.toString()})
          return clientes
        } catch (error) {
          console.log(error);
        }
      },
      obtenerClienteUnico: async (_,{id},ctx) =>{
        //Revisar si el cliente existe 
        const clienteUnico =await Cliente.findById(id)
        if (!clienteUnico) {
          throw new Error('Cliente no encontrado')
        }
        //Quien lo creo puede verlo
        if(clienteUnico.vendedor.toString() !== ctx.usuario.id){
          throw new Error ('No tienes las credenciales')
        }
        return clienteUnico
      },

      obtenerPedidos: async ()=>{
        try {
          const pedidos = await Pedido.find({})
          return pedidos;
        } catch (error) {
          console.log(error);
        }
    },
    obtenerPedidosVendedor: async (_,{},ctx)=>{
     //verificar si el pedido existe o no
      try {
        const pedidos = await Pedido.find({vendedor:ctx.usuario.id}).populate('cliente')
        console.log(pedidos);
        return pedidos;
      } catch (error) {
        console.log(error);
      }
    },

    obtenerPedidoId: async (_, {id}, ctx)=>{
      //verificar si el pedido existe o no
      const pedidoexiste = await  Pedido.findById(id)
      if(!pedidoexiste){
        throw new Error('Pedido no encontrado')
      }
     //Solo puede verlo quien lo creo
     if(pedidoexiste.vendedor.toString() !== ctx.usuario.id){
      throw new Error('Accion no permitida')
     }
     //Retornar el pedido
     return pedidoexiste
    },

    obtenerPedidoEstado: async (_, {estado}, ctx)=>{
      const pedidos = await Pedido.find({vendedor: ctx.usuario.id, estado})
      return pedidos
    },

    mejoresClientes: async ()=>{

      const clientes = await Pedido.aggregate([
        //Los signos de $ son codigo de mongo 
        {$match: {estado: "COMPLETADO"}},
        {$group:{
          _id: "$cliente",
          total:{$sum: '$total'}
        }},
        {
          $lookup: {
            from: 'clientes',
            localField: '_id',
            foreignField: "_id",
            as: "cliente"
          }
        },
        {
          $sort:{ total: -1}
        }
      ])
      return clientes
    },

    mejoresVendedores: async ()=>{
      const vendedores = await Pedido.aggregate([
        {$match: {estado: "COMPLETADO"}},//El estado esta match para ser considerado
        {$group:{
          _id: "$vendedor",
          total:{$sum: '$total'}
        }},
        {
          $lookup: {
            from: 'usuarios',
            localField: '_id',
            foreignField: "_id",
            as: "vendedor"
          }
        },
        {
          $limit: 3
        },
        {
          $sort:{ total: -1}
        }
      ])
      return vendedores
    },

    busquedaProducto: async (_, {texto})=>{
      const producto = await Producto.find({$text:{$search: texto}})
      return producto
    }

    },



    Mutation:{
      nuevoUsuario: async (_, {input} )=> {

        const {email,password}= input;

      //revisar si el usuario ya esta registrado
        const existeUser= await Usuario.findOne({email})
        if (existeUser){
          throw new Error('El usuario ya esta registrado')
        }
      //Hashear sy password
      const salt= await bcryptjs.genSalt(10)
      input.password = await bcryptjs.hash(password, salt)

      //Guardarlo en la base de datos
try {
  const usuario = new Usuario(input);
  usuario.save();
  return usuario
} catch (error) {
  console.log(error);
}
      },

autenticarUsuario: async(_, {input})=>{
  const {email,password}= input
  //Revisar si el usuario existe
const existeUser= await Usuario.findOne({email})
if (!existeUser){
  throw new Error('El usuario no existe')
}

//Revisar si el password es correcto
const passwordValido = await bcryptjs.compare(password,existeUser.password)
if(!passwordValido){
  throw new Error('Password invalido')

  }
  
  //Crear Token
  
  return{
    token: crearToken(existeUser,process.env.SECRET, '24h')
}
},

newProducto: async(_, {input})=>{
try {
  const newProducto =new Producto(input)

  //Almacenar en base de datos

const result = await newProducto.save();
return result

} catch (error) {
  console.log(error);
}
},

actualizarProducto: async (_, {id,input})=>{
  // revisar si existe el pr
  let  producto = await Producto.findById(id);
  if (!producto) {
    throw new Error('Producto no existe')
  }
  //guardar en BD
  producto = await Producto.findOneAndUpdate({ _id: id }, input, {new: true});
  return producto;

},

eliminarProducto: async (_, {id})=>{
// revisar si existe el pr
let  producto = await Producto.findById(id);
if (!producto) {
  throw new Error('Producto no existe')
}
//eliminar Producto
await Producto.findOneAndDelete({ _id: id })
return "Producto Eliminadao"
},

nuevoCliente: async (_, {input},ctx)=>{
  console.log(ctx);
//Verificar si el cliente ya esta registrado
// console.log(input);
const {email} = input
const cliente = await Cliente.findOne({ email })
if(cliente){
  throw new Error('El cliente ya se encuentra registrado')
}

const nuevoCliente = new Cliente(input)
//asignar el vendedor
nuevoCliente.vendedor = ctx.usuario.id
//Guardarlo en Db
try {
  
  const resultado = await nuevoCliente.save()
  return resultado
  
} catch (error) {
  console.log(error);
}
},

actualizarCliente: async (_, {id,input},ctx) =>{
  //Verificar si existe o no
   let clienteActualizado = await Cliente.findById(id)
   if(!clienteActualizado){
    throw new Error('El cliente no existe')
   }
  //Verificar si el vendedor es quien edita
  if(clienteActualizado.vendedor.toString() !== ctx.usuario.id){
    throw new Error ('No tienes las credenciales')
  }


  //Guardar el cliente
  clienteActualizado = await Cliente.findOneAndUpdate({_id:id}, input, {new: true})
  return clienteActualizado;
},

eliminarCliente: async (_, {id},ctx)=>{
 //Verificar si existe o no
 let clienteEliminado = await Cliente.findById(id)
 if(!clienteEliminado){
  throw new Error('El cliente no existe')
 }
//Verificar si el vendedor es quien edita
if(clienteEliminado.vendedor.toString() !== ctx.usuario.id){
  throw new Error ('No tienes las credenciales')
}
//Eliminar Cliente
await Cliente.findOneAndDelete({_id : id})
return "Cliente Eliminado"

},

nuevoPedido: async (_, {input}, ctx) =>{
  
  const {cliente} = input 
  //verificar si el cliente existe o no 
  let clienteExiste = await Cliente.findById(cliente)
  if(!clienteExiste){
   throw new Error('El cliente no existe')
  }

  //Verficar si el cliente es del vendedor 
  if(clienteExiste.vendedor.toString() !== ctx.usuario.id){
    throw new Error ('No tienes las credenciales')
  }


  //Revisar que el stock 
for await(const articulo of input.pedido) {
const {id} = articulo
const producto = await Producto.findById(id)
if(articulo.cantidad > producto.existencia){
  throw new Error(`El articulo: ${producto.nombre} excede la cantidad disponible en la tienda`)
}else {
  // Restar la cantidad 
  producto.existencia= producto.existencia-articulo.cantidad
  await producto.save()
}

} 


//Crear un nuevo pedido  
const nuevoPedido = new Pedido(input)

//Asignar el vendedor
  nuevoPedido.vendedor= ctx.usuario.id;

  
  //Guardarlo en BD
  const resultado = await nuevoPedido.save()
  return resultado
},

actualizarPedido: async(_, {id,input},ctx)=>{

const{cliente}= input
  // Verificar si el pedido existe
const existePedido = await Pedido.findById(id)
if(!existePedido){
  throw new Error('No existe ese pedido')
}
//Verificar si el cliente existe
const existeCliente = await Cliente.findById(cliente)
if(!existeCliente){
  throw new Error('No existe este clienteo')
}

//Ver si el cliente y pedido pertencen al vendedor
if(existeCliente.vendedor.toString() !== ctx.usuario.id){
  throw new Error ('No tienes las credenciales')
}
//Revisar el stock
if(input.pedido){

  for await(const articulo of input.pedido) {
    const {id} = articulo
    const producto = await Producto.findById(id)
    if(articulo.cantidad > producto.existencia){
      throw new Error(`El articulo: ${producto.nombre} excede la cantidad disponible en la tienda`)
    }else {
      // Restar la cantidad 
      producto.existencia= producto.existencia-articulo.cantidad
      await producto.save()
    }
    
    } 
}
//Guardar el pedido
const resultado = await Pedido.findOneAndUpdate({_id: id},input,{new: true})
return resultado
},
eliminarPedido: async  (_, {id},ctx)=>{
  //Verificar si existe o no
  let clienteEliminado = await Pedido.findById(id)
  if(!clienteEliminado){
   throw new Error('El pedido no existe')
  }
 //Verificar si el vendedor es quien edita
 if(clienteEliminado.vendedor.toString() !== ctx.usuario.id){
   throw new Error ('No tienes las credenciales')
 }
 //Eliminar Pedido
 await Pedido.findOneAndDelete({_id : id})
 return "Pedido Eliminado"
 
 }
}
 }
module.exports = resolvers;