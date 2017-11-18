
var fetch = require('node-fetch')

let heroes

const SKILLS = [, "normal", "high", "very high"] // помойки
const API = 'https://api.opendota.com/api/'

var getFetch = async (url) => {
    let response = await fetch(url)
    let result = await response.json( )
    return result
}

async function getHeroes( ) {
    let heroesList = await getFetch(API + 'heroes')
    let result = { }
    heroesList.forEach(function(element) {
        result[element.id] = element
    }, this);
    return result
}

async function getMatch(id) {
    let result = await getFetch(API + 'matches/' + id)
    return result
}

function getHeroInfo(player) {
    return heroes[player.hero_id].localized_name +
        (player.account_id == null ? '' : ' (id: ' + player.account_id + ')')
}

async function main( ) {
    heroes = await getHeroes( )

    let match = await getMatch(3567671555)
    console.log( )
    console.log('radiant pick:')
    for (let i = 0; i < 5; i++) {
        console.log(getHeroInfo(match.players[i]))
    }

    console.log( )
    console.log('dire pick:')
    for (let i = 5; i < 10; i++) {
        console.log(heroes[match.players[i].hero_id].localized_name)
    }

    console.log( )
    console.log('win: ' + (match.radiant_win ? 'radiant' : 'dire'))

    console.log( )
    console.log('skill: ' + SKILLS[match.skill])

    // console.log( )
    // console.log('time: ' + match.duration)
}

main( )
