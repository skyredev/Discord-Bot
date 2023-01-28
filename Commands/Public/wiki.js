const { Client, SlashCommandBuilder, CommandInteraction, PermissionFlagsBits } = require('discord.js');

const Guilds = require('../../Models/Guilds');

module.exports = { //News updates subscription configuration
    name: 'wiki',
    raw:{
        name: 'wiki',
        description: 'Set up wiki.',
        options: [
            {
                "type": 1,
                "name": "create",
                "description": "Create wiki",
                "options": [
                    {
                        "type": 3,
                        "name": "title",
                        "description": "title",
                        "required": true,
                    },
                    {
                        "type": 3,
                        "name": "description",
                        "description": "description",
                        "required": true,
                    },
                    {
                        "type": 3,
                        "name": "hero",
                        "description": "hero name",
                        "required": true,
                    },
                    {
                        "type": 3,
                        "name": "id",
                        "description": "call id",
                        "required": true,
                    },
                    {
                        "type": 11,
                        "name": "icon",
                        "description": "Image of the item",
                        "required": true,
                    }
                ]
            },
            /*{
                "type": 1,
                "name": "request",
                "description": "request wiki",
                "options": [
                    {
                        "type": 3,
                        "name": "id",
                        "description": "Request wiki by id",
                        "required": true,
                    }
                ]
            },*/
        ],
        default_member_permissions: 8,
        dm_permission: false
    },




    /**
     *
     * @param { CommandInteraction } interaction
     */

    async execute(interaction) {
        if(interaction.options.getSubcommand()==='create') {
            try{
                const title = interaction.options.getString('title');
                const description = `${interaction.options.getString('description')}`
                const hero = interaction.options.getString('hero');
                const id = interaction.options.getString('id');
                const icon = interaction.options.getAttachment('icon');
                const guild = await Guilds.findOne({id: interaction.guild.id});

                const message = await interaction.channel.send({
                    embeds: [{
                        title: title,
                        description:  `${description.replace(/\\n/g, `\n`)}`,
                        color: 0x00ff00,
                        footer: {
                            text: `id: ${id}`
                        },
                        thumbnail: {
                            url: icon.url
                        }
                    }]
                });
                guild.wiki.push({
                    title: title,
                    description: description,
                    hero: hero,
                    id: id,
                    icon: icon.url,
                    message: message.id,
                    channel: message.channel.id,
                    guild: message.guild.id,
                });
                await guild.save();
                return interaction.reply({content: `Wiki page created`, ephemeral: true});

            }catch (e) {
                console.log(e)
            }

        }
        /*else if(interaction.options.getSubcommand()==='request') {
            try {
                const id = interaction.options.getString('id');
                const guild = await Guilds.findOne({id: interaction.guild.id});
                const wiki = guild.wiki.find(wiki => wiki.id === id);
                if(!wiki) return interaction.reply({content: `Wiki page not found`});
                else {
                    interaction.reply({content: `https://discord.com/channels/${wiki.guild}/${wiki.channel}/${wiki.message}`})
                }

            }catch (e) {
                console.log(e)
            }




        }*/


    }


}