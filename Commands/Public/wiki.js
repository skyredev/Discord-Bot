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
                        "name": "type",
                        "description": "record type",
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
            {
                "type": 1,
                "name": "edit",
                "description": "edit wiki",
                "options": [
                    {
                        "type": 3,
                        "name": "id",
                        "description": "call id",
                        "required": true,
                    },
                    {
                        "type": 3,
                        "name": "title",
                        "description": "title",
                        "required": false,
                    },
                    {
                        "type": 3,
                        "name": "description",
                        "description": "description",
                        "required": false,
                    },
                    {
                        "type": 3,
                        "name": "hero",
                        "description": "hero name",
                        "required": false,
                    },
                    {
                        "type": 3,
                        "name": "type",
                        "description": "record type",
                        "required": false,
                    },
                    {
                        "type": 11,
                        "name": "icon",
                        "description": "Image of the item",
                        "required":  false,
                    }
                ]
            },
            {
                "type": 1,
                "name": "request",
                "description": "request wiki record",
                "options": [
                    {
                        "type": 3,
                        "name": "id",
                        "description": "call id",
                        "required": true,
                    },
                ]
            },
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
                const description = interaction.options.getString('description')
                const hero = interaction.options.getString('hero');
                const type = interaction.options.getString('type');
                const id = interaction.options.getString('id');
                const icon = interaction.options.getAttachment('icon');
                const guild = await Guilds.findOne({id: interaction.guild.id});

                const message = await interaction.channel.send({
                    embeds: [{
                        title: title,
                        description:  `${description.replace(/\\n/g, `\n`)}`,
                        color: 0x00ff00,
                        fields: [
                            {
                                name: 'Type',
                                value: type,
                            },
                            {
                                name: 'Hero',
                                value: hero,
                            }],
                        footer: {
                            text: `id: ${id}`
                        },
                    }],
                    files: [icon.url]
                });
                guild.wiki.push({
                    title: title,
                    description: description,
                    hero: hero,
                    type: type,
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
        else if(interaction.options.getSubcommand()==='edit') {
            try {
                const title = interaction.options.getString('title');
                const description = interaction.options.getString('description')
                const hero = interaction.options.getString('hero');
                const id = interaction.options.getString('id');
                const icon = interaction.options.getAttachment('icon');
                const type = interaction.options.getString('type');


                const guild = await Guilds.findOne({id: interaction.guild.id});
                let wiki = guild.wiki.find(wiki => wiki.id === id);
                const index = guild.wiki.indexOf(wiki)
                if(!wiki) return interaction.reply({content: `Wiki page not found`}, {ephemeral: true});

                wiki = {
                    title: title === null ? wiki.title : title,
                    description: description === null ? wiki.description : description,
                    hero: hero === null ? wiki.hero : hero,
                    type: type === null ? wiki.type : type,
                    id: wiki.id,
                    icon: icon === null ? wiki.icon : icon.url,
                    message: wiki.message,
                    channel: wiki.channel,
                    guild: wiki.guild,
                }
                guild.wiki[index] = wiki;
                await guild.save();

                const message = await interaction.channel.messages.fetch(wiki.message);
                await message.edit({
                    embeds: [{
                        title: wiki.title,
                        description:   `${wiki.description.replace(/\\n/g, `\n`)}`,
                        color: 0x00ff00,
                        fields: [
                            {
                                name: 'Type',
                                value: wiki.type,
                            },
                            {
                                name: 'Hero',
                                value: wiki.hero,
                            }],
                        footer: {
                            text: `id: ${id}`
                        },
                    }],
                    files: [wiki.icon]
                });
                return interaction.reply({content: `Wiki record edited`, ephemeral: true});



            }catch (e) {
                console.log(e)
            }




        }
        else if(interaction.options.getSubcommand()==='request') {
            try {
                const id = interaction.options.getString('id');
                const guild = await Guilds.findOne({id: interaction.guild.id});
                const wiki = guild.wiki.find(wiki => wiki.id === id);
                if(!wiki) return interaction.reply({content: `Wiki page not found`}, {ephemeral: true});
                else {
                    interaction.reply({content: `https://discord.com/channels/${wiki.guild}/${wiki.channel}/${wiki.message}`})
                }

            }catch (e) {
                console.log(e)
            }




        }


    }


}