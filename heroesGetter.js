
const fetch = require('node-fetch')
const fs = require('fs')

var getFetch = async (url) => {
    let response = await fetch(url)
    let result = await response.json( )
    return result
}

async function main( ) {
    let heroes = await getFetch('https://api.opendota.com/api/heroes')
    let out = ""
    heroes.forEach(function(hero, ind) {
        out += ind + ':' + hero.id + ':' + hero.localized_name + '\n'
    }, this)
    fs.writeFileSync('data/heroesList.txt', out)    
}

main( )
