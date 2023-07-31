const { Client } = require('discord.js');
const {request} = require("undici");
const {getJSONResponse} = require("../../Services/requestServices");
const {requestGameData} = require("../../Services/dataBaseServices");

module.exports = {
    name: 'messageCreate',
    once: false,
    rest:false,
    /**
     *
     * @param { Message } message
     */
    async execute(message, client){
        const botID = '672155669633171488'
        const time = 60*1000;
        const abandonTime = 24*60*60*1000;  // Time after which the game is considered abandoned and the bot will stop watching it
        const abandonCounter = abandonTime/time;

        try {
            if (message.author.id === botID) {
                const embed = message.embeds[0];
                const link = embed.url;
                let counter = 0;

                const linkSplit = link.split('/');
                const regionId = link.split('/').slice(-3)[0];
                const serverId = link.split('/').slice(-2)[0];
                const gameId = link.split('/').slice(-1)[0];
                const gameLink = `https://sc2arcade.com/lobby/${regionId}/${serverId}/${gameId}`


                const onFinish = async (endData, lobbyData)=> {
                    const gamePlayers = {
                        players:[]
                    }

                    for (let i = 0; i < endData.profileMatches.length; i++) {
                        const matchProfile = endData.profileMatches[i]
                        const decision = matchProfile.decision;

                        const profileID = matchProfile.profile.profileId;
                        const realmID = matchProfile.profile.realmId;

                        const response = await request(`https://sc2arcade.com/api/profiles/${regionId}/${realmID}/${profileID}`);
                        const profileData = await getJSONResponse(response.body);
                        const battleTag = profileData.battleTag;

                        console.log(`slot ${i} is ${battleTag}`)

                        gamePlayers.players.push({
                            battleTag: battleTag,
                            decision: decision
                        })

                    }

                    await requestGameData(gameId, regionId, serverId, gameLink, lobbyData.mapVariantMode, gamePlayers, endData.completedAt, lobbyData.closedAt, lobbyData.hostName, message)

                    //message.channel.send({content: `Game Finished\nGame ID: ${gameId} \nRegion ID: ${regionId} \nServer ID: ${serverId} \nGame Mode: ${lobbyData.mapVariantMode}\nPlayers:\n${gamePlayers.players.map(player => `${player.battleTag} - ${player.decision.toUpperCase()}`).join('\n')}\nGame Link: ${gameLink}\nCompleted at: ${endData.completedAt}`})

                }
                const checker = async ()=>{
                    let matchData = undefined;
                    const lobbyResponse = await request(`https://sc2arcade.com/api/lobbies/${regionId}/${serverId}/${gameId}`);
                    const lobbyData = await getJSONResponse(lobbyResponse.body);
                    try{
                        const response = await request(`https://sc2arcade.com/api/lobbies/${regionId}/${serverId}/${gameId}/match`);
                        matchData = await getJSONResponse(response.body);
                        console.log(matchData)
                    }
                    catch (e) {}



                    if (matchData === undefined) {
                        if(lobbyData.status === 'abandoned'){
                            console.log('abandoned')
                            return;
                        }
                        else {
                            console.log(`Waiting for game to end. Game ID is ${gameId}`)
                            counter++;
                            if (counter > abandonCounter) {
                                message.channel.send({content:`The game has been running for over 24 hours. It may have been abandoned. Game ID: ${gameId} \nRegion ID: ${regionId} \nServer ID: ${serverId} \nGame Mode: ${lobbyData.mapVariantMode}\nGame Link: https://sc2arcade.com/lobby/${regionId}/${serverId}/${gameId}`})
                                return;
                            }
                            setTimeout(checker, time);
                        }

                    }
                    else {
                        if (matchData.result === 0) {
                            console.log(matchData.status)
                            await  onFinish(matchData, lobbyData);
                        }
                        else {
                            console.log(`${matchData.result} (Failed to identify), aborting`)
                            return;
                        }


                    }

                }

                setTimeout( checker, time);


            }
        }
        catch (e){
            console.error(e)
        }

    }
}