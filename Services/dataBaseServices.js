const mongoose = require('mongoose');
const Game = require('../Models/Game');
const Player = require('../Models/Player');
const tokens = require("../tokens.json");
const Discord = require("../Models/Discord");
const Guilds = require('../Models/Guilds');
const _ = require("lodash");
const {GuildManager} = require('discord.js');
const {indexOf} = require("lodash");


mongoose.connect(tokens.database);


async function requestGameData(gameId, regionId, serverId, gameLink, gameMode, players, completedAt, closedAt, hostName, message){
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
        await postGameReslts(gameData, message)
        for(let i = 0; i < players.players.length; i++){
            const player = players.players[i];
            await playerData(player.battleTag, player.decision, gameData);
        }
        await calculateMultiplier(gameData.players);
        await calculateMMR(gameData.players)
        await calculateCrystals(gameData.players);

}

async function playerData(battleTag, decision, gameData){

    let player = await Player.findOne({battleTag : battleTag});//find player in database

    let win = 0;
    let loss = 0;

    if(decision === 'win'){
        win = 1;
    }
    if(decision === 'loss' || decision === 'left' || decision === 'tie'){
        loss = 1;
    }



    try{
        const user = await Discord.findOne({battleTag: battleTag})
        let isDonator = false;
        let discordId = null;
        if(user){
            discordId = user.id;
            isDonator = user.isDonator
        }

        if(player){
            player.region.id = gameData.region.id;
            player.region.name = gameData.region.name;
            player.discordId = discordId;
            player.isDonator = isDonator;
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
        else {
            const newPlayer = new Player({
                battleTag: battleTag,
                discordId: discordId,
                isDonator: isDonator,
                isPrivate: false,
                crystals: 0,
                multiplier: 1,
                region:{
                    id: gameData.region.id,
                    name: gameData.region.name,
                },
                games: [gameData],
                stats: {
                    games: 1,
                    wins: win,
                    losses: loss,
                    winRate: win*100,
                    timePlayed: gameData.time.duration,
                    timePlayedPerGame: gameData.time.duration,
                    MMR: 1000,
                    rank: 'Unranked',
                }
            })
            await newPlayer.save();
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

async function postGameReslts(gameData, message) {


    message.reply({
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
                        "value": `${gameData.players.map(player => player.battleTag)} - ${gameData.players.map(player => player.decision.toUpperCase())}`,
                        "inline": true
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
                wiki: []
            })
            await newGuild.save();
        }
        else {
            console.log('Guild already exists')
        }
    }catch (err){
        console.log(err)
    }


}

async function verifyUser(userInfo, connectionsInfo, client, guild){
    try {
        const server = client.guilds.cache.get(guild);

        const guildDb = await Guilds.findOne({id: guild})
        const user = await Discord.findOne({id: userInfo.id});
        const BNet = connectionsInfo.find(connection => connection.type === 'battlenet');

        const member =  await server.members.fetch(userInfo.id);
        const channel = server.channels.cache.get(guildDb.verify.logChannel.id);



        if (BNet) {
            const BNetMatch = await Discord.findOne({battleTag: BNet.id});
            if (BNetMatch) {
                console.log('BNet already exists')
                await member.send({content: `❌ This BNet - [${BNet.id}] has already been verified on [${guildDb.name}] server!`});
            }
            else {
                if (user.verified === true) {
                    console.log('User already verified')
                    await member.send({content: `❌ You are already verified on [${guildDb.name}] server!`});


                } else {
                    const verifyrole = guildDb.verify.verifyRole.id;
                    const player = await Player.findOne({battleTag: BNet.id});
                    if (player) {
                        player.discordId = userInfo.id;
                        player.isDonator = user.isDonator;
                        await player.save();
                    } else {


                        const newPlayer = new Player({
                            battleTag: BNet.id,
                            discordId: userInfo.id,
                            isDonator: user.isDonator,
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
                        await newPlayer.save();
                    }
                    user.verified = true;
                    user.battleTag = BNet.id;
                    await user.save();

                    try {
                        await member.send({content: `✅ BNet account - [${BNet.id}] has been verified on [${guildDb.name}] server!`});

                    } catch (e) {
                        console.log(e)
                    }

                    await member.roles.add(verifyrole);

                    try {
                        channel.send({
                            "content": "",
                            "tts": false,
                            "embeds": [
                                {
                                    "type": "rich",
                                    "title": `Verification`,
                                    "description": `User - [<@${userInfo.id}>] has been verified! \n BattleTag: ${BNet.id} \n Discord ID: ${userInfo.id}`,
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



        } else {
            console.log('Non BNet account')
            await member.send({content: `❌ BNet is not linked to your discord account!`});

        }



    }catch (e) {
        console.log(e)
    }
}

async function getUser(userInfo, guildId, client){
    try {
        const user = await Discord.findOne({id: userInfo.id});
        if (user === null) {
            const server = client.guilds.cache.get(guildId);
            const guild = await Guilds.findOne({id: guildId});
            const member =  await server.members.fetch(userInfo.id);

            let isDonator = false;
            if (member.roles.cache.has(guild.verify.donatorRole.id)) {
                isDonator = true;
            }

            const newUser = new Discord({
                name: `${userInfo.username}#${userInfo.discriminator}`,
                id: userInfo.id,
                isDonator: isDonator,
                isPrivate: false,
                verified: false,
                battleTag: null,
            });
            await newUser.save();
        }

    }catch (e) {
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
                const player = players[i];
                const dbPlayer = await Player.findOne({battleTag: player.battleTag});
                if(player.decision === 'win') dbPlayer.stats.MMR = dbPlayer.stats.MMR + amount;
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
                const player = players[i];
                const dbPlayer = await Player.findOne({battleTag: player.battleTag});
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
                const player = players[i];
                const dbPlayer = await Player.findOne({battleTag: player.battleTag});
                let decisionMultiplier = 1;
                if(player.decision === 'win') {
                    decisionMultiplier = 1.5;
                }
                dbPlayer.crystals += amount * players.length * decisionMultiplier * player.multiplier;
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
    async function sendMessage(player, item, client) {
        const guilds = await Guilds.find({$exists: {shop: true}});
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
                            "title": `Daily Purchase Log`,
                            "description": `**${player.battleTag}** has purchased **${item.id}** for ${item.price} crystals!`,
                            "color": Math.floor((new Date).getDate()/1000 * 16777214) + 1,
                            "timestamp": new Date(),
                        }
                    ]
                    , ephemeral: false})
            }catch (e){
            }
        }))

    }
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



module.exports = {requestGameData, createGuild, verifyUser, getUser, purchases}


