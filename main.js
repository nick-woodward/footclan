function refreshData(){
  const week = 5
  console.log(`getting data for week #${week}`)
  console.log('version 5')
  getFootclanPyramidLeagues(week)
    .then(console.log)
}

async function getFootclanPyramidLeagues(week){
  const leagues = [
    '964336781694992384',
    '964353977129213952',
    '964355209256370176',
    '968918045873750016',
    '968919109754810368',
    '968921105475977216',
    '968956576021196800',
    '968957015991115776',
    '968957621988294656',
    '968958115968344064'
  ]

  const leagueUsers = await Promise.all(leagues.map(l => getLeagueUsers(l)))
  const allUsers = leagueUsers.flat()

  const leagueUserPoints = await Promise.all(
    leagues.map(async league => {
      const leagueRosters = await getLeagueRosters(league)
      const matchups = await getLeagueMatchups(league, week)

      const pointTuples = matchups.map(matchup => {
        const totalPoints = matchup.points
        const user = leagueRosters.find(ro => ro.roster_id === matchup.roster_id)
        const userName = allUsers.find(u => u.user_id === user.owner_id).display_name

        return {
          totalPoints: roundToDecimalPlaces(totalPoints, 2),
          userName,
        }
      })

      return pointTuples
    }
  ))

  const userPoints = leagueUserPoints
        .flat()
        .sort((a,b) => b.totalPoints - a.totalPoints)
        .map(userPoints => {
          return {
            'Username': userPoints.userName,
            'Total Points': userPoints.totalPoints,
          }
        })

  return userPoints
}

function roundToDecimalPlaces(number, decimalPlaces){
  const multiplier = Math.pow(10, decimalPlaces)
  const rounded = Math.round((number + Number.EPSILON) * multiplier) / multiplier
  return rounded
}

async function getLeagueUsers(leagueId){
  const url = `https://api.sleeper.app/v1/league/${leagueId}/users`
  const response = await fetch(url)
  const users = await response.json()
  console.log({users})

  return response.body
}

async function getLeagueRosters(leagueId){
  const url = `https://api.sleeper.app/v1/league/${leagueId}/rosters`
  const response = await fetch(url)
  const rosters = await response.json()
  console.log({rosters})

  return response.body
}

async function getLeagueMatchups(leagueId, week){
  const url = `https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`
  const response = await fetch(url)
  const matchups = await response.json()
  console.log({matchups})

  return response.body
}
