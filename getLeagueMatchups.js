const axios = require('axios')

module.exports = getLeagueMatchups

async function getLeagueMatchups(leagueId, week){
  const response = await axios({
    method: 'GET',
    url: `https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`,
  })

  return response.data
}
