const { SlashCommandBuilder, CommandInteraction, PermissionFlagsBits } = require('discord.js');
const {createGuild} = require('../../Services/dataBaseServices')

module.exports = { //Initializes the guild in the database if somehow it was not initialized when the bot was added to the server or for any other reason
    name: 'guildcreate',
    disabled: false,
    data: new SlashCommandBuilder()
        .setName('guildcreate')
        .setDescription('Create Guild in database')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false)
        ,
    /**
     *
     * @param { CommandInteraction } interaction
     */
    async execute(interaction) {
        await createGuild(interaction.guild);
        return interaction.reply({content: 'Guild Updated!', ephemeral: true});
    }


}