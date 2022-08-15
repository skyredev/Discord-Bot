const { Client, SlashCommandBuilder, CommandInteraction, PermissionFlagsBits } = require('discord.js');

const {saveConfig, getConfig} = require("../../Services/configService");

module.exports = {
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
        default_permission: undefined,
        default_member_permissions: '2048',
        dm_permission: undefined
    },




    /**
     *
     * @param { CommandInteraction } interaction
     */

    async execute(interaction) {
        if(interaction.options.getSubcommand()=='channel') {
            const channel = interaction.options.getChannel('channel');
            const config = getConfig();
            const guild = interaction.guild;
            if (!config.guilds[guild.id])
                config.guilds[guild.id] = {}
            if (!config.guilds[guild.id].news)
                config.guilds[guild.id].news = {}
            config.guilds[guild.id].news.Channel = {id: channel.id, name: channel.name};
            saveConfig(config);
            return interaction.reply({content: 'Channel set!', ephemeral: true});
        }
        else if(interaction.options.getSubcommand()=='status') {
            const status = interaction.options.getBoolean('on-off');
            const config = getConfig();
            const guild = interaction.guild;
            if (!config.guilds[guild.id])
                config.guilds[guild.id] = {}
            if (!config.guilds[guild.id].news)
                config.guilds[guild.id].news = {}
            config.guilds[guild.id].news.Status = status;
            saveConfig(config);
            return interaction.reply({content: 'Status set!', ephemeral: true});
        }
            else if(interaction.options.getSubcommand()=='ping') {
                const role = interaction.options.getRole('role');
                const config = getConfig();
                const guild = interaction.guild;
                if (!config.guilds[guild.id])
                    config.guilds[guild.id] = {}
                if (!config.guilds[guild.id].news)
                    config.guilds[guild.id].news = {}
                config.guilds[guild.id].news.Ping = {id: role.id, name: role.name};
                saveConfig(config);
                return interaction.reply({content: 'Ping set!', ephemeral: true});
            }


    }


}