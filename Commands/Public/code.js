const { Client, SlashCommandBuilder, CommandInteraction, PermissionFlagsBits, managerToFetchingStrategyOptions,
    codeBlock
} = require('discord.js');

const Guilds = require('../../Models/Guilds');
const Player = require('../../Models/Player');
const voucher_codes = require('voucher-code-generator');
const {purchases} = require("../../Services/dataBaseServices");
const {codeCreated} = require("../../Services/dataBaseServices");

module.exports = {
    name: 'code',
    raw:{
        name: 'code',
        description: 'Bonus codes',
        options: [
            {
                "type": 1,
                "name": "generate",
                "description": "Create new code",
                "options": [
                    {
                        "type": 3,
                        "name": "items",
                        "description": "Items id's to claim (separated by comma, no spaces, leave empty if no items)",
                        "required": false,
                    },
                    {
                        "type": 4,
                        "name": "crystals",
                        "description": "Crystals amount to claim (leave empty if no crystals)",
                        "required": false,
                    },
                    {
                        "type": 4,
                        "name": "limit",
                        "description": "How many times code can be used (leave empty if no limit)",
                        "required": false,
                    },
                    {
                        "type": 10,
                        "name": "duration",
                        "description": "How many days code will be active (leave empty if no limit)",
                        "required": false,
                    }
                ]
            },
            {
                "type": 1,
                "name": "create",
                "description": "Create new code",
                "options": [
                    {
                        "type": 3,
                        "name": "code",
                        "description": "Code name",
                        "required": true,
                    },
                    {
                        "type": 3,
                        "name": "items",
                        "description": "Items id's to claim (separated by comma, no spaces, leave empty if no items)",
                        "required": false,
                    },
                    {
                        "type": 4,
                        "name": "crystals",
                        "description": "Crystals amount to claim (leave empty if no crystals)",
                        "required": false,
                    },
                    {
                        "type": 4,
                        "name": "limit",
                        "description": "How many times code can be used (leave empty if no limit)",
                        "required": false,
                    },
                    {
                        "type": 10,
                        "name": "duration",
                        "description": "How many days code will be active (leave empty if no limit)",
                        "required": false,
                    }
                ]
            },
            {
                "type": 1,
                "name": "remove",
                "description": "remove code",
                "options": [
                    {
                        "type": 3,
                        "name": "code",
                        "description": "code id",
                        "required": true,
                    }
                ]
            },
            {
                "type": 1,
                "name": "info",
                "description": "info about code",
                "options": [
                    {
                        "type": 3,
                        "name": "code",
                        "description": "code id",
                        "required": true,
                    }
                ]
            },
            {
                "type": 1,
                "name": "logchannel",
                "description": "Set log channel",
                "options": [
                    {
                        "type": 7,
                        "name": "log",
                        "description": "Choose a channel",
                        "required": true,
                        channelTypes: [0]
                    }
                ]
            },
        ],
        dm_permission: false,
        default_member_permissions: 8,
    },




    /**
     *
     * @param { CommandInteraction } interaction
     */

    async execute(interaction, client) {
        const guild = await Guilds.findOne({ id: interaction.guild.id });
        const subcommand = interaction.options.getSubcommand();
        const itemIds = interaction.options.getString('items')?.split(',').map((item) => item.trim());
        const items = [];

        if (itemIds) {
            for (const itemId of itemIds) {
                const findItem = guild.shop.items.find((dbItem) => dbItem.id === itemId);
                if (!findItem) {
                    interaction.reply({ content: `Item ${itemId} not found! Generation cancelled`, ephemeral: true });
                    return;
                }
                items.push(findItem);
            }
        }

        const crystals = interaction.options.getInteger('crystals');
        const limit = interaction.options.getInteger('limit');
        const duration = interaction.options.getNumber('duration');
        const expiration = duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null;

        let code;
        let newCode;

        switch (subcommand) {
            case 'generate':
                code = voucher_codes.generate({
                    count: 1,
                    charset: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
                    pattern: '####-####-####-####-####'
                })[0];

                if (guild.codes.codePaths.find((dbCode) => dbCode.code === code)) {
                    return interaction.reply({ content: 'Code already exists!', ephemeral: true });
                }

                newCode = {
                    code: code,
                    items: items,
                    crystals: crystals,
                    limit: limit,
                    uses: 0,
                    expiration: expiration,
                };

                guild.codes.codePaths.push(newCode);
                await guild.save();
                await codeCreated(code, crystals, items, limit, expiration, client);
                await interaction.reply({ content: `Code \`${code}\` generated!`, ephemeral: true });
                break;

            case 'create':
                code = interaction.options.getString('code');

                if (guild.codes.codePaths.find((dbCode) => dbCode.code === code)) {
                    return interaction.reply({ content: 'Code already exists!', ephemeral: true });
                }

                newCode = {
                    code: code,
                    items: items,
                    crystals: crystals,
                    limit: limit,
                    uses: 0,
                    expiration: expiration,
                };

                guild.codes.codePaths.push(newCode);
                await guild.save();
                await codeCreated(code, crystals, items, limit, expiration, client);
                await interaction.reply({ content: `Code \`${code}\` created!`, ephemeral: true });
                break;

            case 'remove':
                const codeRemove = interaction.options.getString('code');
                const foundCodeRemove = guild.codes.codePaths.find((dbCode) => dbCode.code === codeRemove);

                if (!foundCodeRemove) {
                    return interaction.reply({ content: 'Code not found!', ephemeral: true });
                }

                guild.codes.codePaths.splice(guild.codes.indexOf(foundCodeRemove), 1);
                guild.markModified('codes');
                await guild.save();
                return interaction.reply({ content: `Code \`${foundCodeRemove.code}\` removed!`, ephemeral: true });
                break;

            case 'info':
                const codeInfo = interaction.options.getString('code');
                const foundCodeInfo = guild.codes.codePaths.find((dbCode) => dbCode.code === codeInfo);

                if (!foundCodeInfo) {
                    return interaction.reply({ content: 'Code not found!', ephemeral: true });
                }

                return interaction.reply({
                    content: codeBlock(
                        `${foundCodeInfo.code}\n\nCode uses: ${foundCodeInfo.uses}\nCode limit: ${foundCodeInfo.limit}\nCode expiration: ${foundCodeInfo.expiration}\nCode crystals: ${foundCodeInfo.crystals}\nCode items:\n\n${foundCodeInfo.items
                            .map((item) => item.title)
                            .join('\n')}`
                    ),
                    ephemeral: true,
                });
                break;

            case 'logchannel':
                const channel = interaction.options.getChannel('log');

                guild.codes.logChannel.id = channel.id;
                guild.codes.logChannel.name = channel.name;
                await guild.save();
                return interaction.reply({ content: `Codes logchannel set to ${channel}`, ephemeral: true });
                break;

            default:
                return interaction.reply({ content: 'Invalid subcommand!', ephemeral: true });
        }
    }

}