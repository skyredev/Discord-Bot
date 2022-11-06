const { CommandInteraction, FetchChannelOptions } = require('discord.js');
const {Buttons} = require("./buttons");

module.exports = {
    name: 'interactionCreate',
    /**
     * @param { CommandInteraction } interaction
     */
    async execute(interaction, client) {
        if(!interaction.isChatInputCommand() && !interaction.isButton()) return;

        let command = client.commands.get(interaction.commandName);

        if(interaction.isButton()) {
            command = client.commands.get(Buttons[interaction.customId]);
        }



        try {
            if (!command) {
                return interaction.reply({content: 'Command not found.'});
            }

            if(interaction.isChatInputCommand()) {
                console.log("ChatInputCommand")
                return command.execute(interaction, client);
            }
            if(interaction.isButton()) {
                console.log("Button")
                return command.executeButton(interaction, client, interaction.customId);
            }



        } catch (error) {
            console.error(error);
            return interaction.reply({content: 'An error occurred. ' + error.message, ephemeral: true});
        }

    }
}