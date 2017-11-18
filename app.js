
const fetch = require('node-fetch')
const fs = require('fs')

let heroes

const SKILLS = [, "normal", "high", "very high"] // помойки
const API = 'https://api.opendota.com/api/'
const MAX_TWR_DMG_QUOTIENT = 29949.0 / 12250

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

function getPlayerCommonInfo(player) {
    return heroes[player.hero_id].localized_name +
        (player.account_id == null ? '' : ' (id: ' + player.account_id + ')')
}

async function main( ) {
    // for restart insert "start matchId + 1" (for example 3567671556) into this and run:
    fs.writeFileSync('data/lastMatch.txt', 3567671556 + 1)

    let lastMatchId = fs.readFileSync('data/lastMatch.txt')

    heroes = await getHeroes( )

    try {
        for (let i = 0; i < 100; i++) {
            let matchId = lastMatchId - 1

            function skip(cause) {
                console.log(matchId + ' was skipped' + (cause != undefined ? ' due to ' + cause : ''))
                i--
                lastMatchId--
            }

            let match = await getMatch(matchId)
            let players = match.players
            if (players == undefined || players.length != 10) {
                skip('wrong number of players')
                continue
            }
            let data = ""
            let twr_dmg = [0, 0]
            players.forEach(function(element, index) {
                data += element.hero_id + ':0.5\n'
                twr_dmg[index < 5 ? 0 : 1] += element.tower_damage
            }, this)
            let radiant_win = match.radiant_win
            data += (radiant_win ? 1 : 0) + '\n'
            let win_side = radiant_win ? 0 : 1
            let lose_side = 1 - win_side
            if (twr_dmg[win_side] < 12250) {
                skip('uncertainty')
                continue
            }
            let quotient = 1 - twr_dmg[lose_side] / (2 * MAX_TWR_DMG_QUOTIENT * twr_dmg[win_side])
            if (quotient <= 0.5 || quotient > 1.0) {
                throw "WTF???"
            }
            data += quotient + '\n'
            fs.writeFileSync('data/matches/' + matchId + '.txt', data)
            console.log(matchId + ' is processed')
            lastMatchId--
        }
        fs.writeFileSync('data/lastMatch.txt', lastMatchId)
    } catch (e) {
        console.error(e)
        fs.writeFileSync('data/lastMatch.txt', lastMatchId)
    }
}

main( )
