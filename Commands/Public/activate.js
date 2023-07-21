const { Client, SlashCommandBuilder, CommandInteraction, PermissionFlagsBits, managerToFetchingStrategyOptions,
    codeBlock
} = require('discord.js');

const Guilds = require('../../Models/Guilds');
const Player = require('../../Models/Player');
const voucher_codes = require('voucher-code-generator');
const {purchases} = require("../../Services/dataBaseServices");
const {codeCreated} = require("../../Services/dataBaseServices");

module.exports = {
    name: 'activate',
    raw:{
        name: 'activate',
        description: 'Activate promo code',
        options: [
            {
                "type": 3,
                "name": "code",
                "description": "Code to activate",
                "required": true,
            }

        ],
        dm_permission: false,
    },




    /**
     *
     * @param { CommandInteraction } interaction
     */

    async execute(interaction, client) {
        try {
            const guild = await Guilds.findOne({ id: interaction.guild.id });
            const codeInput = interaction.options.getString('code');
            const player = await Player.findOne({ discordId: interaction.member.id });

            if (!guild || !codeInput) {
                return interaction.reply({ content: 'Something went wrong!', ephemeral: true });
            }

            const code = guild.codes.codePaths.find(dbCode => dbCode.code === codeInput);

            if (!code) {
                return interaction.reply({ content: 'Code not found!', ephemeral: true });
            }

            if (!player) {
                return interaction.reply({ content: `You have an unverified profile, please complete the bNet verification or contact the administrator <@428827555878010881>`, ephemeral: true });
            }
            if(player.codesUsed.includes(codeInput)){
                return interaction.reply({ content: `You have already used this code`, ephemeral: true });
            }

            if (code.limit && code.limit <= code.uses) {
                return interaction.reply({ content: 'Code limit reached!', ephemeral: true });
            }

            if (code.expiration && code.expiration < Date.now()) {
                return interaction.reply({ content: 'Code expired!', ephemeral: true });
            }

            let content = codeBlock(`Code ${codeInput} Activated\n`);

            if (code.crystals > 0) {
                content += codeBlock('diff', `+ ${code.crystals} crystals\n`);
                player.crystals += code.crystals;
            }

            if (code.items) {
                for (const item of code.items) {
                    const dbItem = player.items.find(dbItem => dbItem.id === item.id);
                    if (dbItem) {
                        content += codeBlock('diff', `+ ${item.title} (already have)\n`);
                    }

                    else if( item.donator && !player.isDonator){
                        content += codeBlock('diff', `${item.title} not added (only for sponsors)\n`);
                        }

                    else {
                        content += codeBlock('diff', `+ ${item.title}\n`);
                        player.items.push({
                            title: item.title,
                            description: item.description,
                            id: `${item.id}`,
                            type: item.type,
                            price: item.price,
                            base: {
                                channel: item.base.channel.id,
                                guild: item.base.channel.guildId,
                            },
                            new: true,
                            source: "promocode",
                        });
                    }
                }
            }

            code.uses++; // Increment the uses count of the code
            guild.markModified('codes');
            player.codesUsed.push(codeInput); // Add the code to the player's codesUsed array
            await Promise.all([player.save(), guild.save()]);
            await purchases(client);
            await interaction.reply({ content: `${content}`, ephemeral: true });
        } catch (e) { }
    }



}