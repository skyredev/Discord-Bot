const { Client, SlashCommandBuilder, CommandInteraction, PermissionFlagsBits } = require('discord.js');

const Guilds = require('../../Models/Guilds');

module.exports = { //News updates subscription configuration
    name: 'news',
    raw:{
        name: 'news',
        description: 'Set up sending news to the server.',
        options: [
            {
                "type": 1,
                "name": "channel",
                "description": "Set news channel",
                "options": [
                    {
                        "type": 7,
                        "name": "channel",
                        "description": "Set news channel",
                        "required": true,
                        channelTypes: [0]
                    }
                ]
            },
            {
                "type": 1,
                "name": "status",
                "description": "Enables/disables sending news",
                "options": [
                    {
                        "type": 5,
                        "name": "on-off",
                        "description": "Enables/disables sending news",
                        "required": true,
                        channelTypes: [0]
                    }
                ]
            },
            {
                "type": 1,
                "name": "ping",
                "description": "Pings role when changes are detected",
                "options": [
                    {
                        "type": 8,
                        "name": "role",
                        "description": "Pings role when changes are detected",
                        "required": true,
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
        if(interaction.options.getSubcommand()==='channel') {
            const channel = interaction.options.getChannel('channel');
            const guild = await Guilds.findOne({id: interaction.guild.id});

            guild.news.channel.id = channel.id;
            guild.news.channel.name = channel.name;
            await guild.save();
            return interaction.reply({content: `News channel set to ${channel}`, ephemeral: true});

        }
        else if(interaction.options.getSubcommand()==='status') {
            const status = interaction.options.getBoolean('on-off');
            const guild = await Guilds.findOne({id: interaction.guild.id});

            guild.news.status = status;
            await guild.save();
            return interaction.reply({content: `News status set to ${status}`, ephemeral: true});

        }
            else if(interaction.options.getSubcommand()==='ping') {
                const role = interaction.options.getRole('role');
                const guild = await Guilds.findOne({id: interaction.guild.id});

                guild.news.ping = role.id;
                await guild.save();
                return interaction.reply({content: `News ping set to ${role}`, ephemeral: true});
            }


    }


}