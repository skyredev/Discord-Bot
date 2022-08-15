const { Client, CommandInteraction, PermissionFlagsBits } = require('discord.js');

const {saveConfig, getConfig} = require("../../Services/configService");

module.exports = {
    name: 'patreon',
    raw:{
        name: 'patreon',
        description: 'Configure Patreon',
        options: [
            {
                "type": 1,
                "name": "channel",
                "description": "Set patreon channel",
                "options": [
                    {
                        "type": 7,
                        "name": "channel",
                        "description": "Choose a channel",
                        "required": true,
                        channelTypes: [0]
                    }
                ]
            },
            {
                "type": 1,
                "name": "status",
                "description": "Enables/disables sending patreon updates",
                "options": [
                    {
                        "type": 5,
                        "name": "on-off",
                        "description": "Enables/disables sending patreon updates",
                        "required": true,
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
            if (!config.guilds[guild.id].patreon)
                config.guilds[guild.id].patreon = {}
            config.guilds[guild.id].patreon.Channel = {id: channel.id, name: channel.name};
            saveConfig(config);
            return interaction.reply({content: 'Channel set!', ephemeral: true});
        }
        else if(interaction.options.getSubcommand()=='status') {
            const status = interaction.options.getBoolean('on-off');
            const config = getConfig();
            const guild = interaction.guild;
            if (!config.guilds[guild.id])
                config.guilds[guild.id] = {}
            if (!config.guilds[guild.id].patreon)
                config.guilds[guild.id].patreon = {}
            config.guilds[guild.id].patreon.Status = status;
            saveConfig(config);
            return interaction.reply({content: 'Status set!', ephemeral: true});
        }
        else if(interaction.options.getSubcommand()=='ping') {
            const role = interaction.options.getRole('role');
            const config = getConfig();
            const guild = interaction.guild;
            if (!config.guilds[guild.id])
                config.guilds[guild.id] = {}
            if (!config.guilds[guild.id].patreon)
                config.guilds[guild.id].patreon = {}
            config.guilds[guild.id].patreon.Ping = role.id;
            saveConfig(config);
            return interaction.reply({content: 'Role set!', ephemeral: true});
        }
    }


}