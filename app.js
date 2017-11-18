
const fetch = require('node-fetch')
const fs = require('fs')

let heroes

const SKILLS = [, "normal", "high", "very high"] // помойки
const API = 'https://api.opendota.com/api/'
const MAX_TWR_DMG_QUOTIENT = 29949.0 / 12250
const RESTART = false

const AVAILABLE_GAME_MODES_ARRAY = [1, 2, 3, 4, 5, 8, 12, 13, 14, 16, 17]
const AVAILABLE_GAME_MODES = { }
AVAILABLE_GAME_MODES_ARRAY.forEach(function(game_mode) {
    AVAILABLE_GAME_MODES[game_mode] = true
}, this)

const AVAILABLE_GAME_LOBBY_TYPES_ARRAY = [0, 7] // 2, 9 is VERY high skill
const AVAILABLE_GAME_LOBBY_TYPES = { }
AVAILABLE_GAME_LOBBY_TYPES_ARRAY.forEach(function(lobby_type) {
    AVAILABLE_GAME_LOBBY_TYPES[lobby_type] = true
}, this)

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
    }, this)
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

var deleteFolderRecursive = function(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function(file, index) {
            var curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory( )) {
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        })
        fs.rmdirSync(path)
    }
}

async function main( ) {
    // for restart insert "start matchId + 1" (for example 3567671556) into this and run:
    if (RESTART) {
        fs.writeFileSync('data/lastMatch.txt', 3567671556 + 1)
        deleteFolderRecursive('data/matches')
        fs.mkdirSync('data/matches')
    }

    let lastMatchId
    lastMatchId = fs.readFileSync('data/lastMatch.txt')
    heroes = await getHeroes( )

    while (true) {
        try {
            while (true) {
                let games = await getFetch('https://api.opendota.com/api/publicMatches?less_than_match_id=' + lastMatchId)
                for (let i = 0; i < games.length; i++) {
                    let game = games[i]
                    if (!AVAILABLE_GAME_MODES[game.game_mode] || !AVAILABLE_GAME_LOBBY_TYPES[game.lobby_type]) {
                        continue
                    }

                    let matchId = game.match_id
                    let match = await getMatch(matchId)
                    if (match.skill == null) {
                        continue
                    }
                    let players = match.players
                    if (players == undefined || players.length != 10) {
                        continue
                    }
                    let data = ""
                    let twr_dmg = [0, 0]
                    players.forEach(function(element, index) {
                        data += element.hero_id + ':' + (element.account_id == null ? -1 : element.account_id) + '\n'
                        twr_dmg[index < 5 ? 0 : 1] += element.tower_damage
                    }, this)
                    let radiant_win = match.radiant_win
                    data += (radiant_win ? 1 : 0) + '\n'
                    let win_side = radiant_win ? 0 : 1
                    let lose_side = 1 - win_side
                    if (twr_dmg[win_side] < 12250) {
                        continue
                    }
                    let quotient = 1 - twr_dmg[lose_side] / (2 * MAX_TWR_DMG_QUOTIENT * twr_dmg[win_side])
                    if (quotient <= 0.5 || quotient > 1.0) {
                        continue
                    }
                    data += quotient + '\n'
                    data += match.skill + '\n'
                    fs.writeFileSync('data/matches/' + matchId + '.txt', data)
                    lastMatchId = matchId
                    fs.writeFileSync('data/lastMatch.txt', lastMatchId)
                }
            }
        } catch (e) {
            console.error(e)
            fs.writeFileSync('data/lastMatch.txt', lastMatchId)
        }
    }
}

main( )
