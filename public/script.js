import kaboom from "https://unpkg.com/kaboom@3000.0.1/dist/kaboom.mjs";
//import * as TWEEN from '@tweenjs/tween.js';
kaboom({
  background: [0, 0, 0,],
});

const socket = io()

const frontendPlayers = {}
const frontendProjectiles = {}
const SPEED = 2
let sequenceNumber = 0
const playerInputs = []

socket.on('connect', () => {
  socket.emit('initCanvas', { width: width(), height: height() })
})

socket.on('updateProjectiles', (backendProjectiles) => {
  for (const id in backendProjectiles) {
    const backendProjectile = backendProjectiles[id]
    
    if (!frontendProjectiles[id]) {
      console.log(frontendPlayers[backendProjectile.playerId])
      frontendProjectiles[id] = add([
        circle(5, 5),
        anchor('center'),
        pos(backendProjectile.x, backendProjectile.y),
        color(frontendPlayers[backendProjectile.playerId]?.color),
        offscreen({ destroy: true })
      ])
    } else {
      //projectile already exists
      frontendProjectiles[id].pos.x += backendProjectile.velocity.x
      frontendProjectiles[id].pos.y += backendProjectile.velocity.y
      
    }
  }

  for (const frontendProjectileId in frontendProjectiles) {
    if (!backendProjectiles[frontendProjectileId]) {
      destroy(frontendProjectiles[frontendProjectileId])
      delete frontendProjectiles[frontendProjectileId]
    }
  }
})

socket.on('updatePlayers', (backendPlayers) => {
  for (const id in backendPlayers) {
    const backendPlayer = backendPlayers[id]

    if (!frontendPlayers[id]) {
      frontendPlayers[id] = add([
        circle(13),
        pos(backendPlayer.x, backendPlayer.y),
        anchor('center'),
        color(hsl2rgb(backendPlayer.color, backendPlayer.saturation, backendPlayer.lightness)),
      ]);
    } else {
      if (id === socket.id) {
        frontendPlayers[id].pos.x = backendPlayer.x
        frontendPlayers[id].pos.y = backendPlayer.y
  
        const lastBackendInputIndex = playerInputs.findIndex(input => {
          return backendPlayer.sequenceNumber === input.sequenceNumber
        })
  
        if (lastBackendInputIndex > -1) {
          playerInputs.splice(0, lastBackendInputIndex + 1)
        }
  
        playerInputs.forEach(input => {
          frontendPlayers[id].pos.x += input.dx
          frontendPlayers[id].pos.y += input.dy
        })
      } else {
        //for all other players
        //gsap.to(frontendPlayers[id].pos, {
        //  x: backendPlayer.x,
        //  y: backendPlayer.y,
        //  duration: 0.015,
        //  ease: 'linear'
        //})
        frontendPlayers[id].pos.x = lerp(frontendPlayers[id].pos.x, backendPlayer.x, 0.4)
        frontendPlayers[id].pos.y = lerp(frontendPlayers[id].pos.y, backendPlayer.y, 0.4)
      }
      

    }
  }

  for (const id in frontendPlayers) {
    if (!backendPlayers[id]) {
      destroy(frontendPlayers[id])
      delete frontendPlayers[id]
    }
  }
})


setInterval(() => {
  if (isKeyDown("w")) {
    if (!frontendPlayers[socket.id]) return
    sequenceNumber++
    playerInputs.push({ sequenceNumber: sequenceNumber, dx: 0, dy: -SPEED })
    frontendPlayers[socket.id].pos.y -= SPEED
    socket.emit('keydown', { keycode: 'KeyW', sequenceNumber: sequenceNumber })
  }
  if (isKeyDown("a")) {
    if (!frontendPlayers[socket.id]) return
    sequenceNumber++
    playerInputs.push({ sequenceNumber: sequenceNumber, dx: -SPEED, dy: 0 })
    frontendPlayers[socket.id].pos.x -= SPEED
    socket.emit('keydown', { keycode: 'KeyA', sequenceNumber: sequenceNumber })
  }
  if (isKeyDown("s")) {
    if (!frontendPlayers[socket.id]) return
    sequenceNumber++
    playerInputs.push({ sequenceNumber: sequenceNumber, dx: 0, dy: SPEED })
    frontendPlayers[socket.id].pos.y += SPEED
    socket.emit('keydown', { keycode: 'KeyS', sequenceNumber: sequenceNumber })
  }
  if (isKeyDown("d")) {
    if (!frontendPlayers[socket.id]) return
    sequenceNumber++
    playerInputs.push({ sequenceNumber: sequenceNumber, dx: SPEED, dy: 0 })
    frontendPlayers[socket.id].pos.x += SPEED
    socket.emit('keydown', { keycode: 'KeyD', sequenceNumber: sequenceNumber })
  }
}, 15)


onKeyPress("space", () => {
  const playerPos = frontendPlayers[socket.id].pos
  const bulletAngle = Math.atan2(mousePos().y - playerPos.y, mousePos().x - playerPos.x)

  const bulletVelocity = new Vec2(Math.cos(bulletAngle), Math.sin(bulletAngle))
  const bulletSpeed = 200
  
  socket.emit('shoot', {
    x: playerPos.x,
    y: playerPos.y,
    angle: bulletAngle
  })
  
  
  
  console.log(frontendProjectiles)
})