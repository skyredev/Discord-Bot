const mongoose = require('mongoose');
const Game = require('../Models/Game');
const Player = require('../Models/Player');
const tokens = require("../tokens.json");
const Guilds = require('../Models/Guilds');
const {patreon} = require("patreon");
const axios = require("axios");


mongoose.connect(tokens.database);


async function requestGameData(gameId, regionId, serverId, gameLink, gameMode, players, completedAt, closedAt, hostName, client, guildId){
        let region = null;
        if(regionId === '1'){
            region = 'US'
        }else if(regionId === '2'){
            region = 'EU'
        }else if(regionId === '3'){
            region = 'KR'
        }else if(regionId === '5'){
            region = 'CN'
        }

        let splitClosedAt = closedAt.split('T');
        splitClosedAt = splitClosedAt[1].split(':');

        let splitCompletedAt = completedAt.split('T');
        splitCompletedAt = splitCompletedAt[1].split(':');

        let duration = (splitCompletedAt[0] - splitClosedAt[0]) * 60 + (splitCompletedAt[1] - splitClosedAt[1]);

        if(duration < 0){
            return;
        }

        const gameData = {
            gameId: gameId,
            region: {
                id: parseInt(regionId),
                name: region,
            },
            serverId: serverId,
            gameMode: gameMode,
            players: players.players,
            time: {
                duration: duration,
                closedAt: closedAt,
                completedAt: completedAt,
            },
            hostName: hostName,
            gameLink: gameLink,
        }
        await postGameData(gameData)
        await postGameReslts(gameData, client, guildId)
        for(let i = 0; i < players.players.length; i++){
            const player = players.players[i];
            await playerData(player.link, player.decision, gameData);
        }

        await calculateMultiplier(gameData.players);
        await calculateMMR(gameData.players)
        await calculateCrystals(gameData.players);

}

async function playerData(link, decision, gameData){

    let player = await Player.findOne({
        handles: {
            $elemMatch: {
                profileUrl: link
            }
        }
    });//find player in database

    let win = 0;
    let loss = 0;

    if(decision === 'win'){
        win = 1;
    }
    if(decision === 'loss' || decision === 'left' || decision === 'tie'){
        loss = 1;
    }



    try{

        if(player){
            player.region.id = gameData.region.id;
            player.region.name = gameData.region.name;
            player.stats.losses += loss;
            player.stats.wins += win;
            player.stats.games += 1;
            player.stats.timePlayed += gameData.time.duration;
            player.stats.timePlayedPerGame = player.stats.timePlayed / player.stats.games;
            player.stats.timePlayedPerGame = Math.round(player.stats.timePlayedPerGame * 10) / 10;
            player.stats.winRate = Math.round((player.stats.wins / player.stats.games)*10000)/100;
            player.games.push(gameData);

            await player.save();

        }


    }

    catch(err){console.log(err)}



}

async function postGameData(gameData){

    const game = new Game({
        gameId: gameData.gameId,
        region:{
            id: gameData.region.id,
            name: gameData.region.name,
        },
        serverId: gameData.serverId,
        gameMode: gameData.gameMode,
        players: gameData.players,
        time: gameData.time,
        hostName: gameData.hostName,
        gameLink: gameData.gameLink,

    });
    await game.save()
}

async function postGameReslts(gameData, client, guildId) {
    const server = client.guilds.cache.get(guildId);
    const guildDb = await Guilds.findOne({id: guildId})
    const channel = server.channels.cache.get(guildDb.system.gamesLog.id);

    channel.send({
        embeds: [
            {
                "type": "rich",
                "title": `Game ${gameData.gameId} has been completed!`,
                "description": "Here are the results:",
                "url": gameData.gameLink,
                "color": 0xbb1ad7,
                "timestamp": gameData.time.completedAt,
                "fields": [
                    {
                        "name": "Game ID",
                        "value": `${gameData.gameId}`,
                        "inline": true
                    },
                    {
                        "name": "Region",
                        "value": `${gameData.region.name}`,
                        "inline": true
                    },
                    {
                        "name": "Game Mode",
                        "value": `${gameData.gameMode}`,
                        "inline": true
                    },
                    {
                        "name": "Host Name",
                        "value": `${gameData.hostName}`,
                        "inline": true
                    },
                    {
                        "name": "Duration",
                        "value": `${gameData.time.duration} minutes`,
                        "inline": true
                    },
                    {
                        "name": "Players",
                        "value": `${gameData.players.map(player => player.name)} - ${gameData.players.map(player => player.decision.toUpperCase())}`,
                        "inline": false
                    },
                ]
            }
        ]
    })
}

async function createGuild(guild){
    try{
        const find = await Guilds.findOne({id: guild.id})
        if(!find){
            const newGuild = new Guilds({
                id: guild.id,
                name: guild.name,
                patreon: {
                    channel: {
                        id: null,
                        name: null,
                    },
                    status: null,
                    hash: null,
                    ping: null,
                },
                news: {
                    channel: {
                        id: null,
                        name: null,
                    },
                    status: null,
                    ping: null,
                    hash: null,
                },
                verify: {
                    logChannel: {
                        id: null,
                        name: null,
                    },
                    donatorRole: {
                        id: null,
                        name: null,
                    },
                    verifyRole: {
                        id: null,
                        name: null,
                    }
                },
                shop:{
                    logChannel: {
                        id: null,
                        name: null,
                    },
                    channel: {
                        id: null,
                        name: null,
                    },
                    items: [],
                },
                wiki: [],
                codes: {
                    logChannel: {
                        id: null,
                        name: null,
                    },
                    codePaths: [],
                },
            })
            await newGuild.save();
        }
        else {
            // update not existed fields
            if(!find.system){
                find.system = {
                    gamesLog:{
                        id: null,
                        name: null,
                    }
                }
            }
            if(!find.patreon){
                find.patreon = {
                    channel: {
                        id: null,
                        name: null,
                    },
                    status: null,
                    hash: null,
                    ping: null,
                }
            }
            if(!find.news){
                find.news = {
                    channel: {
                        id: null,
                        name: null,
                    },
                    status: null,
                    ping: null,
                    hash: null,
                }
            }
            if(!find.verify){
                find.verify = {
                    logChannel: {
                        id: null,
                        name: null,
                    },
                    donatorRole: {
                        id: null,
                        name: null,
                    },
                    verifyRole: {
                        id: null,
                        name: null,
                    }
                }
            }
            if(!find.shop){
                find.shop = {
                    logChannel: {
                        id: null,
                        name: null,
                    },
                    channel: {
                        id: null,
                        name: null,
                    },
                    items: [],
                }
            }
            if(!find.wiki){
                find.wiki = []
            }
            if(!find.codes){
                find.codes= {
                    logChannel: {
                        id: null,
                        name: null,
                    },
                    codePaths: [],
                }
            }
            if(!find.authLinks){
                find.authLinks = []
            }
            console.log("updated guild")
            await find.save();
        }
    }catch (err){
        console.log(err)
    }


}

async function authUser(battleTag, battleId, discordId, discordName , apiToken ,client, guild){
    try {
        const server = client.guilds.cache.get(guild);
        const member =  await server.members.fetch(discordId);
        let handles = null;
        let maxAttempts = 999;
        let attempts = 0;

        while (!handles && attempts < maxAttempts) {
            attempts++;

            try {
                handles = await axios.get(`https://eu.api.blizzard.com/sc2/player/${battleId}`, {
                    params: {
                        'access_token': `${apiToken}`
                    }
                });
                //console.log("eu");
            } catch (e) {
                //console.log("Error on EU:", e.message);

                try {
                    handles = await axios.get(`https://us.api.blizzard.com/sc2/player/${battleId}`, {
                        params: {
                            'access_token': `${apiToken}`
                        }
                    });
                    //console.log("us");
                } catch (e) {
                    //console.log("Error on US:", e.message);

                    try {
                        handles = await axios.get(`https://kr.api.blizzard.com/sc2/player/${battleId}`, {
                            params: {
                                'access_token': `${apiToken}`
                            }
                        });
                        //console.log("kr");
                    } catch (e) {
                        //console.log("Error on KR:", e.message);
                    }
                }
            }

            // Sleep for 4 seconds before the next attempt
            if (!handles) {
                await new Promise(res => setTimeout(res, 4000));
            }
        }

// If after all attempts, handles is still not set.
        if (!handles) {
            await member.send({content: `❌ Failed to get data after multiple attempts. Blizzard Error 404. Please try to authorize again.`});
            console.log("Failed to get data after multiple attempts.");
        }
        //console.log(JSON.stringify(handles.data, null, 2));


        const guildDb = await Guilds.findOne({id: guild})
        //console.log(discordId)
        //console.log(battleTag)
        const player = await Player.findOne({battleTag: battleTag});


        const channel = server.channels.cache.get(guildDb.verify.logChannel.id);





        if (battleTag) {
            if(player){
                if (player.battleTag === battleTag && player.handles.length === handles.data.length) {
                    console.log('BNet already exists')
                    await member.send({content: `❌ This BNet - [${battleTag}] has already been authorized on [${guildDb.name}] server!`});
                }
                else if (player.battleTag === battleTag) {
                    console.log(`Bnet already exists but handles are different`)
                    player.handles = handles.data;
                    await player.save();
                    await member.send({content: `New profiles have been detected for - [${battleTag}] on [${guildDb.name}]. Successfully added!`});
                }
            }

            else {
                const newPlayer = new Player({
                    battleTag: battleTag,
                    battleId: battleId,
                    handles: handles.data,
                    discordId: discordId,
                    discordName: discordName,
                    isDonator: false,
                    isPrivate: false,
                    multiplier: 1,
                    crystals: 0,
                    region: {
                        id: null,
                        name: null,
                    },
                    games: [],
                    stats: {
                        games: 0,
                        wins: 0,
                        losses: 0,
                        winRate: 0,
                        timePlayed: 0,
                        timePlayedPerGame: 0,
                        MMR: 1000,
                        rank: '',
                    }
                })

                if(member.roles.cache.has(guildDb.verify.donatorRole.id || guildDb.verify.aliasRoles.some(role => member.roles.cache.has(role.id)))) {
                    newPlayer.isDonator = true;
                }
                await newPlayer.save();

                await member.roles.add(guildDb.verify.verifyRole.id);
                try {
                    await member.send({content: `✅ BNet account - [${battleTag}] has been verified on [${guildDb.name}] server!`});
                } catch (e) {
                    console.log(e)
                }

                try {
                    channel.send({
                        "content": "",
                        "tts": false,
                        "embeds": [
                            {
                                "type": "rich",
                                "title": `Verification`,
                                "description": `User - [<@${discordId}>] has been verified! \n BattleTag: ${battleTag} \n Discord ID: ${discordId}`,
                                "timestamp": new Date(),
                                "color": 0x6fff00
                            }
                        ]
                    });
                } catch (e) {
                    console.log(e)
                }


            }

        }

        else {
            console.log('Non BNet account')
            await member.send({content: `❌ Blizzard API occurred, please contact <@428827555878010881>!`});
    }






    }catch (e) {
        console.log(e)
    }
}



async function calculateMMR(players) {
    /*    const winTeamSum = winTeam.reduce((acc, rating) => acc + rating, 0);     //MMR calculation for each player in the game the ELO formula is used here // Deprecated // Not using ELO system anymore
        const loseTeamSum = loseTeam.reduce((acc, rating) => acc + rating, 0);
        let winTeamAvg = winTeamSum / winTeam.length;
        let loseTeamAvg = loseTeamSum / loseTeam.length;
        if(winTeam.length === 0) winTeamAvg = 0
        if(loseTeam.length === 0) loseTeamAvg = 0
        let gameAvg = (winTeamAvg + loseTeamAvg);
        if((winTeam.length + loseTeam.length) > 1) gameAvg = gameAvg / 2;
        console.log(gameAvg);
        for (let i = 0; i < winTeam.length; i++) {
                let winPlayerELO = winTeam[i];

                // Calculate the expected score for each player
                let winExpected = 1 / (1 + Math.pow(10, (loseTeamAvg - winTeamAvg) / 400));

                let K = 56;
                if((gameAvg - winPlayerELO) > 100){
                    K = 64;
                }
                if((gameAvg - winPlayerELO) > 200){
                    K = 72;
                }
                if((gameAvg - winPlayerELO) < -100){
                    K = 48;
                }



            winTeam[i] = Math.round(winPlayerELO + K * (1 - winExpected))
            }
        for (let i = 0; i < loseTeam.length; i++) {
                let losePlayerELO = loseTeam[i];

                // Calculate the expected score for each player
                let loseExpected = 1 / (1 + Math.pow(10, (winTeamAvg - loseTeamAvg) / 400));

                let K = 64;
                if((gameAvg - losePlayerELO) > 100){
                    K = 56;
                }
                if((gameAvg - losePlayerELO) > 200){
                    K = 48;
                }
                if((gameAvg - losePlayerELO) < -100){
                    K = 72;
                }

                // Calculate the new ELO for each player
                loseTeam[i] = Math.round(losePlayerELO + K * (0 - loseExpected))
            }

        for(let i = 0; i < winPlayers.length; i++){
            const player = await Player.findOne({battleTag: winPlayers[i]});
            player.stats.MMR = winTeam[i];
            player.save();
        }
        for(let i = 0; i < loosePlayers.length; i++){
            const player = await Player.findOne({battleTag: loosePlayers[i]});
            player.stats.MMR = loseTeam[i];
            player.save();
        }*/
        try {
            const amount = 10;

            for (let i = 0; i < players.length; i++) {
                const dbPlayer = await Player.findOne({
                    handles: {
                        $elemMatch: {
                            profileUrl: players[i].link
                        }
                    }
                });
                if(!dbPlayer) continue;
                if(players[i].decision === 'win') dbPlayer.stats.MMR = dbPlayer.stats.MMR + amount;
                else dbPlayer.stats.MMR = dbPlayer.stats.MMR - amount;
                await dbPlayer.save();
            }
        }catch (e) {
            console.log(e)
        }

}


async function calculateMultiplier(players){
        try{
            for (let i = 0; i < players.length; i++) {
                const dbPlayer = await Player.findOne({
                    handles: {
                        $elemMatch: {
                            profileUrl: players[i].link
                        }
                    }
                });
                if(!dbPlayer) continue;
                if(dbPlayer.isDonator===true){
                    dbPlayer.multiplier = 1.5;
                }else{
                    dbPlayer.multiplier = 1;
                }
                await dbPlayer.save();
            }
        }catch (e) {
            console.log(e)
        }

}

async function calculateCrystals(players){
        try {
            const amount = 1;
            for (let i = 0; i < players.length; i++) {
                const dbPlayer = await Player.findOne({
                    handles: {
                        $elemMatch: {
                            profileUrl: players[i].link
                        }
                    }
                });
                if(!dbPlayer) continue;
                let decisionMultiplier = 1;
                if(players[i].decision === 'win') {
                    decisionMultiplier = 1.5;
                }
                dbPlayer.crystals += amount * players.length * decisionMultiplier * dbPlayer.multiplier;
                await dbPlayer.save();
            }
        }catch (e) {
            console.log(e)
        }

}

async function purchases(client){
    const players = await Player.find({ items: { $exists: true } }).populate('items');

    for (const player of players) {
        const items = player.items;

        for (const item of items) {
            if (item.new === true) {
                item.new = false;
                player.markModified('items');
                await player.save();
                await sendMessage(player, item, client);
            }
        }


    }
    async function sendMessage(player, item, client){
        const guilds = await Guilds.find({$exists: {shop: true}});
        let message = null
        if(item.source === "shop"){
            message = "Shop Purchase Log"
        }
        else if(item.source === "promocode"){
            message = "Promocode Activation Log"
        }
        await Promise.all(guilds.map(async guild => {
            try{
                const thisGuild = await client.guilds.cache.get(guild.id);
                const thisChannel = await thisGuild.channels.fetch(guild.shop.logChannel.id);
                thisChannel.send({
                    "content": "",
                    "tts": false,
                    "embeds": [
                        {
                            "type": "rich",
                            "title": message,
                            "description": `New Purchase - **${item.type}**`,
                            "color": Math.floor((new Date).getDate()/1000/4*7*11/3*6*9/14 * 16777214) + 1,
                            "fields": [
                                {
                                    "name": "Player",
                                    "value": `**${player.battleTag}**`,
                                    "inline": true
                                },
                                {
                                    "name": "Price",
                                    "value": `**${item.price}**`,
                                    "inline": true
                                },
                                {
                                    "name": "Item",
                                    "value": `**${item.id}**`,
                                    "inline": true
                                },
                                {
                                    "name": "Sponsor",
                                    "value": `**${player.isDonator}**`,
                                    "inline": true
                                }
                            ],
                            "timestamp": new Date(),
                        }
                    ]
                    , ephemeral: false})
            }catch (e){
            }
        }))

    }


}
async function codeCreated(code, crystals, items, limit, duration, client){
    const guilds = await Guilds.find({$exists: {shop: true}});
    if(items.length === 0){
        items[0] = "null";
    }
    else{
        items = items.map(item => item.title);
    }


    await Promise.all(guilds.map(async guild => {
        try{
            const thisGuild = await client.guilds.cache.get(guild.id);
            const thisChannel = await thisGuild.channels.fetch(guild.codes.logChannel.id);
            thisChannel.send({
                "content": "",
                "tts": false,
                "embeds": [
                    {
                        "type": "rich",
                        "title": "New promocode created!",
                        "description": `\n**${code}**\n`,
                        "color": Math.floor((new Date).getDate()/1000/4*7*11/3*6*9/14 * 16777214) + 1,
                        "fields": [
                            {
                                "name": "Crystals",
                                "value": `${crystals}`,
                                "inline": true
                            },
                            {
                                "name": "Items",
                                "value": `${items.join('\n')}`,
                                "inline": true
                            },
                            {
                                "name": "Limit",
                                "value": `${limit}`,
                                "inline": true
                            },
                            {
                                "name": "Valid till",
                                "value": `${duration}`,
                                "inline": true,
                            }
                        ],
                        "timestamp": new Date(),
                    }
                ]
                , ephemeral: false})
        }catch (e){
        }
    }))

}

async function calculateRank(players){
    const Ranks = {
        0: 'Bronze',
        1: 'Silver',
        2: 'Gold',
        3: 'Platinum',
        4: 'Diamond',
        5: 'Master',
        6: 'Grandmaster',
    }

}



module.exports = {requestGameData, createGuild, authUser, purchases, codeCreated}


