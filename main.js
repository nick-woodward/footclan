const getLeagueMatchups = require('./getLeagueMatchups.js')
const getLeagueRosters = require('./getLeagueRosters.js')
const getLeagueUsers = require('./getLeagueUsers.js')

function refreshData(){
  const week = 5
  console.log(`getting data for week #${week}`)
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

