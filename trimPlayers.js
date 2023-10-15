const fs = require('fs')
const players = require('./players.json')

// console.log(Object.keys(players[1001]))

const playersArray = Object.keys(players)
      .filter(playerId => players[playerId].team)
      .map(playerId => {
        return {
          playerId,
          name: players[playerId].full_name
        } 
      })

console.log({count: playersArray.length})

fs.writeFileSync('playersArray.json', JSON.stringify(playersArray))

// console.log({playersArray})
