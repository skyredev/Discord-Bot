const { CommandInteraction, FetchChannelOptions } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    /**
     * @param { CommandInteraction } interaction
     */
    async execute(interaction, client) {
        if(!interaction.isChatInputCommand()) return;
        const command = client.commands.get(interaction.commandName);

        try {
            if (!command) {
                return interaction.reply({content: 'Command not found.'});
            }
            return command.execute(interaction, client);
        } catch (error) {
            console.error(error);
            return interaction.reply({content: 'An error occurred. ' + error.message, ephemeral: true});
        }

    }
}