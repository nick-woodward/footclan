async function selectDefaultWeek(){
  const el = document.getElementById("weekSelect");
  const weeks = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17]
  weeks.map(week => {
    const option = document.createElement("option");
    option.text = `Week ${week}`;
    option.value = week;
    el.add(option);
  })

  const defaultWeek = await getCurrentWeek()
  el.value = defaultWeek

  refreshData()
}

function refreshData(){
  const e = document.getElementById("weekSelect");
  const week = e.value
  console.log(`getting data for week #${week}`)

  const table = document.getElementById("myTable").getElementsByTagName('tbody')[0];
  table.innerHTML = ''

  getFootclanPyramidLeagues(week)
    .then(data => {

      data.map(d => {
        // Create an empty <tr> element and add it to the 1st position of the table:
        var row = table.insertRow();

        // Insert new cells (<td> elements) at the 1st and 2nd position of the "new" <tr> element:
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        var cell4 = row.insertCell(3);

        // Add some text to the new cells:
        cell1.innerHTML = d["number"];
        cell2.innerHTML = d["Username"];
        cell3.innerHTML = d["Total Points"];
        cell4.innerHTML = d["Projected Points"];
      })
      return data
    })
}

const leagueIds = [
  '1115497335099854848',
  '1115499097240219648',
  '1115499851573243904',
  '1118397683862990848',
  '1118399055689859072',
  '1118399305796190208',
  '1118407743951462400',
  '1118407928643448833',
  '1118408322476097536',
  '1118408777230876672'
]

async function getFootclanPyramidLeagues(week){
  let leagues = await Promise.all(leagueIds.map(leagueId => getLeague(leagueId)))

  // decorate with users
  leagues = await Promise.all(leagues.map(async league => {
    const leagueUsers = await getLeagueUsers(league.league_id)
    league.users = leagueUsers
    return league
  }))
  console.log('loaded users')

  // decorate with rosters
  leagues = await Promise.all(leagues.map(async league => {
    const leagueRosters = await getLeagueRosters(league.league_id)
    league.rosters = leagueRosters
    return league
  }))
  console.log('loaded rosters')

  // decorate with matchups
  leagues = await Promise.all(leagues.map(async league => {
    const matchups = await getLeagueMatchups(league.league_id, week)
    league.matchups = matchups
    return league
  }))
  console.log('loaded matchups')
  console.log(leagues)

  const allStarterIds = leagues
        .flatMap(league => league.matchups)
        .flatMap(matchup => matchup.starters)
  const uniqueStarterIds = Array.from(new Set(allStarterIds))

  const starterProjections = await Promise.all(
    uniqueStarterIds.map(
      async starterId => {
        const playerProjectedStats = await getPlayerProjectionByWeek(starterId, week)
        const playerStats = await getPlayerStatsByWeek(starterId, week)
        const scoreProjection = calculateProjection(playerProjectedStats, playerStats, leagues[0].scoring_settings)

        return {
          starterId,
          scoreProjection,
        }
      }
    )
  )
  
  console.log(leagues)
  console.log(starterProjections)
  // decorate with matchup projections
  leagues = leagues.map(league => {
    league.matchups = league.matchups.map(matchup => {
      console.log({matchup})
      matchup.projection = calculateTeamProjection(matchup.starters, starterProjections)
      return matchup
    })
    return league
  })
  console.log('loaded projections')

  // decorate with matchup usernames
  leagues = leagues.map(league => {
    league.matchups = league.matchups.map(matchup => {
      const user = league.rosters.find(ro => ro.roster_id === matchup.roster_id)
      matchup.userName = leagues.flatMap(l => l.users).find(u => u.user_id === user.owner_id).display_name
      return matchup
    })
    return league
  })
  console.log('loaded matchup usernames')

  // decorate with point tuples
  leagues = await Promise.all(leagues.map(async league => {
    const pointTuples = league.matchups.map(matchup => {
      return {
        projection: matchup.projection,
        totalPoints: roundToDecimalPlaces(matchup.points, 2),
        userName: matchup.userName,
      }
    })

    league.pointTuples = pointTuples

    return league
  }))
  console.log('loaded point tuples')

  const leagueUserPoints = leagues.flatMap(l => l.pointTuples)
  const userPoints = formatOutput(leagueUserPoints)
  return userPoints
}

function calculateTeamProjection(starters, starterProjections){
  const totalScore = starters.reduce((total, starterId) => {
    const points = starterProjections
          .find(sp => sp.starterId === starterId)
          .scoreProjection

    return +points + +total
  }, 0)

  return roundToDecimalPlaces(totalScore, 2)
}

function formatOutput(leagueUserPoints){
  return leagueUserPoints
    .flat()
    .sort((a,b) => b.projection - a.projection)
    .map((userPoints,index) => {
      return {
        'Username': userPoints.userName,
        'Total Points': userPoints.totalPoints,
        'Projected Points': userPoints.projection,
        number: +1 + +index,
      }
    })
}

function roundToDecimalPlaces(number, decimalPlaces){
  const multiplier = Math.pow(10, decimalPlaces)
  const rounded = Math.round((number + Number.EPSILON) * multiplier) / multiplier

  return rounded > 0 ? rounded.toFixed(2) : 0
}

async function getLeagueUsers(leagueId){
  const url = `https://api.sleeper.app/v1/league/${leagueId}/users`
  const response = await fetch(url)
  const users = await response.json()

  return users
}

async function getLeagueRosters(leagueId){
  const url = `https://api.sleeper.app/v1/league/${leagueId}/rosters`
  const response = await fetch(url)
  const rosters = await response.json()

  return rosters
}

async function getLeagueMatchups(leagueId, week){
  const url = `https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`
  const response = await fetch(url)
  const matchups = await response.json()

  return matchups
}

async function getCurrentWeek(){
  const url = `https://api.sleeper.app/v1/state/nfl`
  const response = await fetch(url)
  const state = await response.json()

  return state.week
}

async function getPlayerStatsByWeek(playerId, week){
  const season  = 2024
  const url = `https://api.sleeper.com/stats/nfl/player/${playerId}?season_type=regular&season=${season}&grouping=week`
  const response = await fetch(url)
  const stats = await response.json()
  const weekStats = stats[week]
  if(!weekStats){
    return {}
  }

  return weekStats.stats
}

async function getPlayerProjectionByWeek(playerId, week){
  const season  = 2024
  const url = `https://api.sleeper.com/projections/nfl/player/${playerId}?season_type=regular&season=${season}&grouping=week`
  const response = await fetch(url)
  const projections = await response.json()
  const weekProjection = projections[week]
  if(!weekProjection){
    return {}
  }

  return weekProjection.stats
}

async function getLeague(leagueId){
  const url = `https://api.sleeper.app/v1/league/${leagueId}`
  const response = await fetch(url)
  const league = await response.json()

  return league
}

function calculateProjection(projectedStats, playerStats, scoreSettings){
  const stats = playerStats.gp ? playerStats : projectedStats

  let score = 0
  for(const stat in stats) {
    const multiplier = scoreSettings[stat] ? scoreSettings[stat] : 0;
    score += stats[stat] * multiplier;
  }
  return score;
}

