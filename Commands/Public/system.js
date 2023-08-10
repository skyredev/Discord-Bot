const {CommandInteraction } = require('discord.js');

const Guilds = require('../../Models/Guilds');

module.exports = { //News updates subscription configuration
    name: 'system',
    raw:{
        name: 'system',
        description: 'Bot system configuration',
        options: [
            {
                "type": 1,
                "name": "gamelog",
                "description": "Set gamelog channel",
                "options": [
                    {
                        "type": 7,
                        "name": "channel",
                        "description": "Set news channel",
                        "required": true,
                        channelTypes: [0]
                    }
                ]
            }
        ],
        default_member_permissions: 8,
        dm_permission: false
    },




    /**
     *
     * @param { CommandInteraction } interaction
     */

    async execute(interaction) {
        if(interaction.options.getSubcommand()==='gamelog') {
            const channel = interaction.options.getChannel('channel');
            const guild = await Guilds.findOne({id: interaction.guild.id});

            guild.system.gamesLog.id = channel.id;
            guild.system.gamesLog.name = channel.name;
            await guild.save();
            return interaction.reply({content: `Gameslog channel set to ${channel}`, ephemeral: true});

        }


    }


}