function setupFormSubmission(){
  document.getElementById('userName').onkeydown = function(e){
    if(e.keyCode == 13){
      loadCompetitors()
    }
  }
  const userNameEl = document.getElementById("userName")
  userNameEl.value = ''
}

async function loadCompetitors(){
  const userNameEl = document.getElementById("userName")

  // clear out the data right after it's grabbed
  const userName = userNameEl.value
  userNameEl.value = null

  const table = document.getElementById("competitorsTable").getElementsByTagName('tbody')[0]
  table.innerHTML = ''

  const user = await getUser(userName)
  const userLeagues = await getLeagues(user.user_id)
  const users = await getAllLeagueUsers(userLeagues, user.user_id)

  const userIds = users.map(user => user.user_id)
  const uniqueUserIds = Array.from(new Set(userIds))
  const userTuples = uniqueUserIds.map(
    userId => {
      return {
        user: users.find(user => user.user_id === userId)
      }
    }
  )

  const userLeaguesTuples = await decorateUserTuplesWithLeagues(userTuples, userLeagues, user.user_id)

  userLeaguesTuples
    .sort((tupleA, tupleB) => {
      return tupleB.managedLeagues.length - tupleA.managedLeagues.length
    })
    .sort((tupleA, tupleB) => {
      return tupleB.leaguesWithYou.length - tupleA.leaguesWithYou.length
    })
    .sort((tupleA, tupleB) => {
      return tupleB.leaguesWithYou.join() - tupleA.leaguesWithYou.join()
    })

    .forEach((tuple, index) => {
      // Create an empty <tr> element and add it to the 1st position of the table:
      var row = table.insertRow()

      // Insert new cells (<td> elements) at the 1st and 2nd position of the "new" <tr> element:
      var cell1 = row.insertCell(0)
      var cell2 = row.insertCell(1)
      var cell3 = row.insertCell(2)
      var cell4 = row.insertCell(3)
      var cell5 = row.insertCell(4)
      var cell6 = row.insertCell(5)

      // Add some text to the new cells:
      cell1.innerHTML = +index + 1
      cell2.innerHTML = tuple.user.display_name
      cell3.innerHTML = tuple.leaguesWithYou.length
      cell4.innerHTML = tuple.leaguesWithYou.join(', ')
      cell5.innerHTML = tuple.managedLeagues.length
      cell6.innerHTML = tuple.bbLeagues.length
    })
}

async function getUser(userName){
  const url = `https://api.sleeper.app/v1/user/${userName}`
  const response = await fetch(url)
  const users = await response.json()

  return users
}

async function getLeagues(userId){
  const url = `https://api.sleeper.app/v1/user/${userId}/leagues/nfl/2023`
  const response = await fetch(url)
  const leagues = await response.json()

  return leagues
}

async function getAllLeagueUsers(leagues, userId){
  const usersByLeague = await Promise.all(
    leagues.map(async league => {
      const users = await getLeagueUsers(league.league_id)
      return users
    })
  )

  const leaguesWithoutUser = usersByLeague
        .flat()
        // .filter(user => user.user_id !== userId)

  return leaguesWithoutUser
}

async function getLeagueUsers(leagueId){
  const url = `https://api.sleeper.app/v1/league/${leagueId}/users`
  const response = await fetch(url)
  const users = await response.json()

  return users
}

async function decorateUserTuplesWithLeagues(userLeaguesTuples, leaguesWithYou){
  return Promise.all(
    userLeaguesTuples.map(async userLeaguesTuples => {
      const allLeagues = await getLeagues(userLeaguesTuples.user.user_id)
      const bbLeagues = allLeagues.filter(l => l.settings.best_ball === 1)
      const dynastyLeagues = allLeagues.filter(l => l.settings.best_ball === undefined)
      const redraftLeagues = allLeagues.filter(l => l.settings.best_ball === 0)

      userLeaguesTuples.leagues = allLeagues
      userLeaguesTuples.bbLeagues = bbLeagues
      userLeaguesTuples.managedLeagues = [...redraftLeagues, ...dynastyLeagues]

      userLeaguesTuples.leaguesWithYou = getLeaguesWithYouByUser(leaguesWithYou, userLeaguesTuples.leagues)
      return userLeaguesTuples
    })
  )
}

function getLeaguesWithYouByUser(yourLeagues, theirLeagues){
  return theirLeagues
    .filter(league => {
      return yourLeagues.find(aLeague => aLeague.league_id === league.league_id)
    })
    .map(l => l.name)
}

