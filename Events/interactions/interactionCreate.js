const { CommandInteraction, FetchChannelOptions } = require('discord.js');
const {Buttons} = require("./buttons");

module.exports = {
    name: 'interactionCreate',
    /**
     * @param { CommandInteraction } interaction
     */
    async execute(interaction, client) { //Interaction handler
        if(!interaction.isChatInputCommand() && !interaction.isButton() && !interaction.isUserContextMenuCommand()) return;

        let command = client.commands.get(interaction.commandName);

        if(interaction.isButton()) {
            command = client.commands.get(Buttons[interaction.customId]);
            if(interaction.customId.startsWith('shop_')){
                command = client.commands.get('shop');
            }
            else if(interaction.customId.startsWith('testing_')){
                command = client.commands.get('testing');
            }
            else if(interaction.customId.startsWith('accept_')){
                command = client.commands.get('testing');
            }
            else if(interaction.customId.startsWith('reject_')){
                command = client.commands.get('testing');
            }
            else if(interaction.customId.startsWith('cleaning')){
                command = client.commands.get('testing');
            }
            else if(interaction.customId.startsWith('warning')){
                command = client.commands.get('testing');
            }
        }



        try {
            if(interaction.isButton()) {
                if(!command){
                    let {executeButton} = require(`${Buttons[interaction.customId]}`);
                    if(interaction.customId.startsWith('shop_')){
                        executeButton = require(`shop`);
                    }
                    else if(interaction.customId.startsWith('testing_')){
                        executeButton = require(`testing`);
                    }
                    else if(interaction.customId.startsWith('accept_')){
                        executeButton = require(`testing`);
                    }
                    else if(interaction.customId.startsWith('reject_')){
                        executeButton = require(`testing`);
                    }
                    else if(interaction.customId.startsWith('cleaning')){
                        executeButton = require(`testing`);
                    }
                    else if(interaction.customId.startsWith('warning')){
                        executeButton = require(`testing`);
                    }
                    return await executeButton(interaction, client, interaction.customId);
                }else {
                    return command.executeButton(interaction, client, interaction.customId);
                }
            }
            if (!command) {
                return interaction.reply({content: 'Command not found.', ephemeral: true});
            }

            if(interaction.isChatInputCommand() || interaction.isUserContextMenuCommand()) {
                return command.execute(interaction, client);
            }



        } catch (error) {
            console.error(error);
            return interaction.reply({content: 'An error occurred. ' + error.message, ephemeral: true});
        }

    }
}