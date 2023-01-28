const { Client, CommandInteraction, PermissionFlagsBits } = require('discord.js');

const Guilds = require('../../Models/Guilds');

module.exports = { //Patreon updates subscription configuration
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

            guild.patreon.channel.id = channel.id;
            guild.patreon.channel.name = channel.name;
            await guild.save();
            return interaction.reply({content: `Patreon channel set to ${channel}`, ephemeral: true});
        }
        else if(interaction.options.getSubcommand()==='status') {
            const status = interaction.options.getBoolean('on-off');
            const guild = await Guilds.findOne({id: interaction.guild.id});

            guild.patreon.status = status;
            await guild.save();
            return interaction.reply({content: `Patreon status set to ${status}`, ephemeral: true});
        }
        else if(interaction.options.getSubcommand()==='ping') {
            const role = interaction.options.getRole('role');
            const guild = await Guilds.findOne({id: interaction.guild.id});

            guild.patreon.ping = role.id;
            await guild.save();
            return interaction.reply({content: `Patreon role set to ${role}`, ephemeral: true});
        }
    }


}