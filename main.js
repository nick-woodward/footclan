async function selectDefaultWeek(){
  const el = document.getElementById("weekSelect");
  const weeks = [1,2,3,4,5,6,7,8,9,10,11,12,13,14]
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
        console.log({d})
        // Create an empty <tr> element and add it to the 1st position of the table:
        var row = table.insertRow();

        // Insert new cells (<td> elements) at the 1st and 2nd position of the "new" <tr> element:
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);

        // Add some text to the new cells:
        cell1.innerHTML = d["Username"];
        cell2.innerHTML = d["Total Points"];
      })
      console.log({data})
    })
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

  return rounded > 0 ? rounded.toFixed(2) : 0
}

async function getLeagueUsers(leagueId){
  const url = `https://api.sleeper.app/v1/league/${leagueId}/users`
  const response = await fetch(url)
  const users = await response.json()
  console.log({users})

  return users
}

async function getLeagueRosters(leagueId){
  const url = `https://api.sleeper.app/v1/league/${leagueId}/rosters`
  const response = await fetch(url)
  const rosters = await response.json()
  console.log({rosters})

  return rosters
}

async function getLeagueMatchups(leagueId, week){
  const url = `https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`
  const response = await fetch(url)
  const matchups = await response.json()
  console.log({matchups})

  return matchups
}

async function getCurrentWeek(){
  const url = `https://api.sleeper.app/v1/state/nfl`
  const response = await fetch(url)
  const state = await response.json()

  return state.week
}
