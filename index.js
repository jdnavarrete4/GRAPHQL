const {ApolloServer} = require('apollo-server');
const resolvers = require('./db/resolver');
const typeDefs = require('./db/schema');
const conectarDB = require('./config/db');
const jwt= require('jsonwebtoken');
require ('dotenv').config({path: 'variables.env'})
//Conectar aabse de ddatos
conectarDB()



//servidor
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({req})=>{
// console.log(req.headers['authorization']);
//  console.log(req.headers);
const token= req.headers['authorization'] || ''
if(token){
    try {
        const usuario = jwt.verify(token.replace('Bearer ', ''),process.env.SECRET)//la palabra secreta esta en variables.env
         console.log(usuario);
        return{
            usuario
        }
    } catch (error) {
        console.log(error);
        console.log('Error detectado');
    }
}
    }
});

//Arranca el servidor
server.listen({port: process.env.PORT || 4000}).then(({url})=>{
    console.log(`Servidor corriendo en la url ${url}`);
})