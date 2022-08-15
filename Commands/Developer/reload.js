const { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } = require('discord.js');
const { loadEvents } = require('../../Handlers/eventHandler');
const { loadCommands } = require('../../Handlers/commandHandler');
module.exports = {
    disabled:true,
    name: 'reload',
    developer : true,
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('Reload Events/Commands!')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand((options) =>
            options
                .setName('commands')
                .setDescription('Reload Commands!'))
        .addSubcommand((options) =>
            options
                .setName('events')
                .setDescription('Reload Events!')),


    /**
     *
     * @param { ChatInputCommandInteraction } interaction
     */
    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'commands':
                loadCommands(interaction.client);
                return interaction.reply({content: 'Reloading Commands...'});
                break;
            case 'events':
                loadEvents(interaction.client);
                return interaction.reply({content: 'Reloading Events...'});
                break;
        }
    }


}