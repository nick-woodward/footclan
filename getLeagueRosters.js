const axios = require('axios')

module.exports = getLeagueRosters

async function getLeagueRosters(leagueId){
  const response = await axios({
    method: 'GET',
    url: `https://api.sleeper.app/v1/league/${leagueId}/rosters`,
  })

  return response.data
}
