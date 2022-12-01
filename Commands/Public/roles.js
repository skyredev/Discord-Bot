const { Client, SlashCommandBuilder, CommandInteraction, PermissionFlagsBits, RoleManager, codeBlock} = require('discord.js');

const {saveConfig, getConfig} = require("../../Services/configService");

module.exports = {
    name: 'roles',
    disabled:false,
    data: new SlashCommandBuilder()
        .setName('roles')
        .setDescription('Select your game server role!')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    ,

    /**
     *
     * @param { CommandInteraction } interaction
     */

    async execute(interaction) {
        return interaction.reply({
            "content": "",
            "tts": false,
            "components": [
                {
                    "type": 1,
                    "components": [
                        {
                            "style": 1,
                            "label": `EU`,
                            "emoji": `🇪🇺`,
                            "custom_id": `eu`,
                            "disabled": false,
                            "type": 2
                        },
                        {
                            "style": 1,
                            "label": `NA`,
                            "emoji": `🇺🇸`,
                            "custom_id": `na`,
                            "disabled": false,
                            "type": 2
                        },
                        {
                            "style": 1,
                            "label": `KR`,
                            "emoji": `🇰🇷`,
                            "custom_id": `kr`,
                            "disabled": false,
                            "type": 2
                        },
                        {
                            "style": 4,
                            "label": `Clean all roles`,
                            "custom_id": `clean`,
                            "emoji": `🗑️`,
                            "disabled": false,
                            "type": 2
                        }
                    ]
                }
            ],
            "embeds": [
                {
                    "type": "rich",
                    "title": `Roles Selector`,
                    "description": `Click on the button to get or remove the role of the Region you are playing on!`,
                    "color": 0x6fff00
                }
            ]
        , ephemeral: false});

    },

    async executeButton(interaction, client, id) {
        try{
            const button = id;
            const guild = interaction.guild;
            const member = interaction.member;




           const role = guild.roles.cache.find(x => x.name === button.toUpperCase());

            if (button === 'clean') {
                const rolesToRemove = guild.roles.cache.filter(x => ["EU", "NA", "KR"].includes(x.name))
                await member.roles.remove(rolesToRemove);
                return interaction.reply({content: codeBlock("fix",`🗑️ All roles removed!` ), ephemeral: true});
            }
            if (member.roles.cache.has(role.id)) {
                await member.roles.remove(role);
                return interaction.reply({content: codeBlock("diff",`- Removed role ${role.name}!`), ephemeral: true});
            } else {
                await member.roles.add(role);
                return interaction.reply({content: codeBlock("diff",`+ Added role ${role.name}!`), ephemeral: true});
            }
        }
        catch (error) {
            console.error(error);
            return interaction.reply({content: 'An error occurred. ' + error.message, ephemeral: true});
        }


    }


}