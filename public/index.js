const express = require('express')
const app = express()
//socket.io setup
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, { pingInterval: 2000, pingTimeout: 5000 });


const port = 3000

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/client/index.html')
})

const backendPlayers = {}
const backendProjectiles = {}
const SPEED = 2
let projectileId = 0

io.on('connection', (socket) => {
  console.log('a user has connected')
  backendPlayers[socket.id] = {
    x: 500 * Math.random(),
    y: 500 * Math.random(),
    color: 1 * Math.random(),
    saturation: 1,
    lightness: 0.5,
    sequenceNumber: 0
  }

  io.emit('updatePlayers', backendPlayers)

  socket.on('initCanvas', ({ width, height }) => {
    backendPlayers[socket.id].canvas = {
      width,
      height
    }
  })
  
  socket.on('shoot', ( {x, y, angle} ) => {
    projectileId++

    const velocity = {
      x: Math.cos(angle) * 5,
      y: Math.sin(angle) * 5
    }
    
    backendProjectiles[projectileId] = {
      x: x,
      y: y,
      velocity: velocity,
      playerId: socket.id
    }

    console.log(backendProjectiles)
  })
  
  socket.on('disconnect', (reason) => {
    console.log(reason)
    delete backendPlayers[socket.id]
    io.emit('updatePlayers', backendPlayers)
  })

  socket.on('keydown', ({ keycode, sequenceNumber }) => {
    backendPlayers[socket.id].sequenceNumber = sequenceNumber
    switch (keycode) {
      case 'KeyW':
        backendPlayers[socket.id].y -= SPEED
        break

      case 'KeyA':
        backendPlayers[socket.id].x -= SPEED
        break

      case 'KeyS':
        backendPlayers[socket.id].y += SPEED
        break

      case 'KeyD':
        backendPlayers[socket.id].x += SPEED
        break
    }
  })

  console.log(backendPlayers)
})

setInterval(() => {
  //update projectile positions
  for (const id in backendProjectiles) {
    backendProjectiles[id].x += backendProjectiles[id].velocity.x
    backendProjectiles[id].y += backendProjectiles[id].velocity.y

    if (backendProjectiles[id].x - 5 >= backendPlayers[backendProjectiles[id].playerId]?.canvas?.width || backendProjectiles[id].x + 5 <= 0 || backendProjectiles[id].y - 5 >= backendPlayers[backendProjectiles[id].playerId]?.canvas?.height || backendProjectiles[id].y + 5 <= 0) {
      delete backendProjectiles[id]
      console.log("deleted")
    }

  }
  io.emit('updateProjectiles', backendProjectiles)
  io.emit('updatePlayers', backendPlayers)
}, 15)

server.listen(port, () => {
  console.log(`Server online port ${port}, all systems nominal`)
});