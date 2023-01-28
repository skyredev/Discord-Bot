const { SlashCommandBuilder, CommandInteraction, PermissionFlagsBits } = require('discord.js');

module.exports = { // Basic ping command - disabled
    name: 'ping',
    disabled: true,
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Pong!')
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
        ,
    /**
     *
     * @param { CommandInteraction } interaction
     */
    async execute(interaction) {
        return interaction.reply({content: 'Pong!', ephemeral: true});
    }


}