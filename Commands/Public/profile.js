const { CommandInteraction} = require('discord.js');
const Player = require('../../Models/Player');
const Discord = require('../../Models/Discord');

module.exports = { //User application command, sends ephemeral message to user with their game data from database
    name: 'Stats',
    disabled: false,
    raw:{
        name: 'Stats',
        type: 2,
    },

    /**
     *
     * @param { CommandInteraction } interaction
     */

    async execute(interaction) {
        let player = null;
        try {
            const user = await Discord.findOne({id: interaction.targetId});
            player = await Player.findOne({battleTag: user.battleTag});
        }catch (e) {
        }


        if (!player){
            return interaction.reply({content: `The user is not verified or don't have any statistics`, ephemeral: true});
        }
        else {
            return interaction.reply({
                ephemeral: true,
                embeds: [
                    {
                        "type": "rich",
                        "title": `${player.battleTag} Statistics`,
                        "color": 49407,
                        "fields": [
                            {
                                "name": "Games Played",
                                "value": `${player.stats.games}`,
                                "inline": true
                            },
                            {
                                "name": "Victories",
                                "value": `${player.stats.wins}`,
                                "inline": true
                            },
                            {
                                "name": "Defeats",
                                "value": `${player.stats.losses}`,
                                "inline": true
                            },
                            {
                                "name": "Winrate",
                                "value": `${player.stats.winRate}%`,
                                "inline": true
                            },
                            {
                                "name": "Time Played",
                                "value": `${Math.floor(player.stats.timePlayed / 60)} hours`,
                                "inline": true
                            },
                            {
                                "name": "Average Time Per Game",
                                "value": `${player.stats.timePlayedPerGame} minutes`,
                                "inline": true
                            },
                            {
                                "name": "MMR",
                                "value": `${player.stats.MMR}`,
                                "inline": true
                            },
                            {
                                "name": "Rank",
                                "value": `${player.stats.rank}`,
                                "inline": true
                            },
                        ]
                    }]

            });
        }

    },



}