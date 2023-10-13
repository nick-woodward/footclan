const axios = require('axios')

module.exports = getLeagueUsers

async function getLeagueUsers(leagueId){
  const response = await axios({
    method: 'GET',
    url: `https://api.sleeper.app/v1/league/${leagueId}/users`,
  })

  return response.data
    // .map(user => {
    // const { display_name, user_id } = user
    // return { display_name, user_id }
  // })

}

// getLeagueUsers('968957621988294656')
  // .then(console.log)
