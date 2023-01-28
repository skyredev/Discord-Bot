const { Client, SlashCommandBuilder, CommandInteraction, PermissionFlagsBits } = require('discord.js');
const Guilds = require('../../Models/Guilds');

module.exports = { // Setup for the verification
    name: 'verifysetup',
    raw:{
        name: 'verifysetup',
        description: 'Configure verification',
        options: [
            {
                "type": 1,
                "name": "logchannel",
                "description": "Set verify request revision channel!",
                "options": [
                    {
                        "type": 7,
                        "name": "logchannel",
                        "description": "Set verify request revision channel!",
                        "required": true,
                        channelTypes: [0]
                    }
                ]
            },
            {
                "type": 1,
                "name": "donatorrole",
                "description": "Set donator role!",
                "options": [
                    {
                        "type": 8,
                        "name": "donatorrole",
                        "description": "Set donator role!",
                        "required": true,
                    }
                ]
            },
            {
                "type": 1,
                "name": "verifyrole",
                "description": "Set verify role!",
                "options": [
                    {
                        "type": 8,
                        "name": "verifyrole",
                        "description": "Set verify role!",
                        "required": true,
                    }
                ]
            },

        ],
        default_member_permissions: 8,
        dm_permission: false
    },




    /**
     *
     * @param { CommandInteraction } interaction
     */

    async execute(interaction) {
        if(interaction.options.getSubcommand() === 'logchannel') {
            const channel = interaction.options.getChannel('logchannel');
            const guild = await Guilds.findOne({id: interaction.guild.id});

            guild.verify.logChannel.id = channel.id;
            guild.verify.logChannel.name = channel.name;
            await guild.save();
            interaction.reply({content: `Verify log channel set to #${channel.name}`, ephemeral: true});
        }
        if(interaction.options.getSubcommand() === 'donatorrole') {
            const role = interaction.options.getRole('donatorrole');
            const guild = await Guilds.findOne({id: interaction.guild.id});

            guild.verify.donatorRole.id = role.id;
            guild.verify.donatorRole.name = role.name;
            await guild.save();
            interaction.reply({content: `Donator role set to #${role.name}`, ephemeral: true});
        }
        if(interaction.options.getSubcommand() === 'verifyrole') {
            const role = interaction.options.getRole('verifyrole');
            const guild = await Guilds.findOne({id: interaction.guild.id});

            guild.verify.verifyRole.id = role.id;
            guild.verify.verifyRole.name = role.name;
            await guild.save();
            interaction.reply({content: `Verify role set to #${role.name}`, ephemeral: true});
        }
    }


}