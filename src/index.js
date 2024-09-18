const path = require('path')
const http = require('http')
const express = require ('express')
const socketio = require('socket.io')
const {generateMessage} = require('./utils/messages')
const {addUser,removeUser,getUser,getUsersInRoom} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const publicDirectoryPath = path.join(__dirname,'../public')

const port = process.env.PORT || 3000

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket)=>{
    console.log('New websocket connection')

    socket.on('join',({username,room},callback) => {
        const {error,user} = addUser({id: socket.id,username,room})
        if(error){
            return callback(error)
        }
        socket.join(user.room)

        
        socket.emit('message',generateMessage('Admin','Welcome!'))
        //socket.broadcast sends message to all the connected users except the one who is sending
        //.to method helps us send msg to users in a particular room only
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined!`))

        io.to(user.room).emit('roomData',{
            room : user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage',(message,callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('message',generateMessage(user.username,message))
        callback('Delivered')   //callback is acknowledgement from the client
    })

    socket.on('sendLocation',(coords,callback) => {
        const user = getUser(socket.id)
        //below line sends location as google map
        io.to(user.room).emit('locationMessage',generateMessage(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })

    //this is called when a client disconnects
    socket.on('disconnect',() => {
        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('message', generateMessage('Admin',`${user.username} has left!`))
            io.to(user.room).emit('roomData',{
                room : user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})






// let count = 0
/*io.on('connection', (socket)=>{
    console.log('New websocket connection')
    // server (emit) -> client (recieve) - countUpdated
    // client (emit) -> server (recieve) - increment
    //SENDING COUNT TO EVERY CONNECTING CLIENT, AND CLIENT CAN INCREMENT COUNT EXAMPLE 
    socket.emit('countUpdated',count)
    socket.on('increment',() => {
        count++
        //socket.emit, emits to a specific connected client
        //socket.emit('countUpdated',count)

        io.emit('countUpdated',count)       //this emits to all the connected clients
    })
})*/