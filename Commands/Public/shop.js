const { CommandInteraction } = require('discord.js');

const Guilds = require('../../Models/Guilds');
const Player = require('../../Models/Player');
const {purchases} = require("../../Services/dataBaseServices");

module.exports = { // The shop, where users can by any items you created, includes channel, items setup. Uses Discord Forum and threads to create shop and display items
    name: 'shop',
    raw: {
        name: 'shop',
        description: 'Configure Shop',
        options: [
            {
                "type": 1,
                "name": "channel",
                "description": "Set shop channel",
                "options": [
                    {
                        "type": 7,
                        "name": "channel",
                        "description": "Choose a channel",
                        "required": true,
                        channelTypes: [15]
                    }
                ]
            },
            {
                "type": 1,
                "name": "create",
                "description": "Create a shop item",
                "options": [
                    {
                        "type": 3,
                        "name": "title",
                        "description": "Name of the item",
                        "required": true,
                    },
                    {
                        "type": 3,
                        "name": "description",
                        "description": "Description of the item",
                        "required": true,
                    },
                    {
                        "type": 3,
                        "name": "id",
                        "description": "Item ID, must be unique (ID of the item will always have prefix shop_)",
                        "required": true,
                    },
                    {
                        "type": 3,
                        "name": "type",
                        "description": "Item type Mount/Skin/Banner/Spray",
                        "required": true,
                    },
                    {
                        "type": 4,
                        "name": "price",
                        "description": "Price of the item",
                        "required": true,
                    },
                    {
                        "type": 5,
                        "name": "donator",
                        "description": "Donator required to buy this item",
                        "required": true,
                    },
                    {
                        "type": 11,
                        "name": "image",
                        "description": "Image of the item",
                        "required": true,
                    }
                ],
            },
            {
                "type": 1,
                "name": "edit",
                "description": "Edit a shop item",
                "options": [
                    {
                        "type": 3,
                        "name": "id",
                        "description": "ID of Item (with prefix shop_)",
                        "required": true,
                    },
                    {
                        "type": 3,
                        "name": "title",
                        "description": "Name of the item",
                    },
                    {
                        "type": 3,
                        "name": "description",
                        "description": "Description of the item",
                    },
                    {
                        "type": 4,
                        "name": "price",
                        "description": "Price of the item",
                    },
                    {
                        "type": 5,
                        "name": "donator",
                        "description": "Donator required to buy this item",
                    },
                    {
                        "type": 11,
                        "name": "image",
                        "description": "Image of the item",
                    }
                ],
            },
            {
                "type": 1,
                "name": "give",
                "description": "Give Crystals to a player",
                "options": [
                    {
                        "type": 4,
                        "name": "amount",
                        "description": "Amount of Crystals",
                        "required": true,
                    },
                    {
                        "type": 6,
                        "name": "player",
                        "description": "Player to give Crystals to",
                        required: true,
                    },
                ],
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
        default_member_permissions: 8,
        dm_permission: false,
    },


    /**
     *
     * @param { CommandInteraction } interaction
     */

    async execute(interaction) {
        if(interaction.options.getSubcommand()==='channel') {
            const channel = interaction.options.getChannel('channel');
            const guild = await Guilds.findOne({id: interaction.guild.id});

            guild.shop.channel.id = channel.id;
            guild.shop.channel.name = channel.name;
            await guild.save();
            return interaction.reply({content: `Shop channel set to ${channel}`, ephemeral: true});
        }
        if(interaction.options.getSubcommand()==='logchannel') {
            const channel = interaction.options.getChannel('log');
            const guild = await Guilds.findOne({id: interaction.guild.id});

            guild.shop.logChannel.id = channel.id;
            guild.shop.logChannel.name = channel.name;
            await guild.save();
            return interaction.reply({content: `Shop channel set to ${channel}`, ephemeral: true});
        }

        else if(interaction.options.getSubcommand()==='create') {
            try {
                const title = interaction.options.getString('title');
                const description = interaction.options.getString('description');
                const id = interaction.options.getString('id');
                const type = interaction.options.getString('type');
                const price = interaction.options.getInteger('price');
                const donator = interaction.options.getBoolean('donator');
                const image = interaction.options.getAttachment('image');


                const guild = await Guilds.findOne({id: interaction.guild.id});
                if(guild.shop.items.find(item => item.id === id)) return interaction.reply({content: `Item with this ID already exists`, ephemeral: true}); //return if item already exists
                if (guild.shop.channel.id) {
                    let channel = interaction.guild.channels.cache.get(guild.shop.channel.id)
                    const tags = []
                    for (let i = 0; i < channel.availableTags.length; i++) {
                        if (channel.availableTags[i].name.toLowerCase() === type.toLowerCase()) {
                            tags.push(channel.availableTags[i].id)
                        }
                        if (donator === true) {
                            if (channel.availableTags[i].name.toLowerCase() === 'sponsors') {
                                tags.push(channel.availableTags[i].id)
                            }
                        }
                    }


                    if (channel) {
                        channel = await channel.threads.create({
                                name: title,
                                reason: 'Shop Item',
                                message: {
                                    embeds: [
                                        {
                                            type: 'rich',
                                            title: title,
                                            description: description,
                                            color: Math.floor(Math.random() * 16777214) + 1,
                                            footer: {
                                                text: `ID: shop_${id}`,
                                            }
                                        }],
                                    components: [
                                        {
                                            type: 1,
                                            components: [
                                                {
                                                    style: 3,
                                                    label: `💎 ${price}`,
                                                    custom_id: `shop_${id}`,
                                                    disabled: false,
                                                    type: 2
                                                },
                                            ]
                                        }
                                    ],
                                    files: [image.url]
                                },
                                appliedTags: tags
                            }
                        );


                        const item = {
                            title: title,
                            description: description,
                            id: `shop_${id}`,
                            type: type,
                            price: price,
                            image: image.url,
                            donator: donator,
                            base: {
                                channel: channel.id,
                                guild: channel.guildId,
                            }
                        }
                        guild.shop.items.push(item);
                        await guild.save();
                        return interaction.reply({content: `Shop item created`, ephemeral: true});


                    } else {
                        return interaction.reply({content: `Shop channel not found`, ephemeral: true});
                    }
                } else {
                    return interaction.reply({content: `Shop channel not set`, ephemeral: true});
                }
            } catch (e) {
                console.log(e)
            }
        }

        else if(interaction.options.getSubcommand()==='edit') {

            try {

                const title = interaction.options.getString('title');
                const description = interaction.options.getString('description');
                const id = interaction.options.getString('id');
                const price = interaction.options.getInteger('price');
                const donator = interaction.options.getBoolean('donator');
                const image = interaction.options.getAttachment('image');


                const guild = await Guilds.findOne({id: interaction.guild.id});
                let item = guild.shop.items.find(item => item.id === id);
                const index = guild.shop.items.indexOf(item);
                if (!item) return interaction.reply({content: `Item not found`, ephemeral: true}); //return if item not found

                    if (guild.shop.channel.id) {
                        let channel = await interaction.guild.channels.fetch(item.base.channel)

                            if (channel) {
                                let message = await channel.messages.fetch(item.base.channel);

                                item = {
                                    title: title === null ? item.title : title,
                                    description: description === null ? item.description : description,
                                    id: `${item.id}`,
                                    type: item.type,
                                    price: price === null ? item.price : price,
                                    image: image === null ? item.image : image.url,
                                    donator: donator === null ? item.donator : donator,
                                    base: {
                                        channel: channel.id,
                                        guild: channel.guildId,
                                    }
                                }
                                guild.shop.items[index] = item;
                                await guild.save();

                                await message.edit({
                                    embeds: [
                                        {
                                            type: 'rich',
                                            title: item.title,
                                            description: item.description,
                                            color: Math.floor(Math.random() * 16777214) + 1,
                                            footer: {
                                                text: `ID: ${item.id}`
                                            }
                                        }],
                                    components: [
                                        {
                                            type: 1,
                                            components: [
                                                {
                                                    style: 3,
                                                    label: `💎 ${item.price}`,
                                                    custom_id: `${item.id}`,
                                                    disabled: false,
                                                    type: 2
                                                },
                                            ]
                                        }
                                    ],
                                    files: [item.image]
                                })




                                return interaction.reply({content: `Shop item updated`, ephemeral: true});


                            } else {
                                return interaction.reply({content: `Shop channel not found`, ephemeral: true});
                            }
                    } else {
                        return interaction.reply({content: `Shop channel not set`, ephemeral: true});
                    }
            } catch (e) {
                console.log(e)
            }
        }

        else if(interaction.options.getSubcommand()==='give') {

            try {

                const amount = interaction.options.getInteger('amount');
                const user = interaction.options.getUser('player');
                const player = await Player.findOne({discordId: user.id});
                const member = await interaction.guild.members.fetch(user.id);

                if(player) {
                    player.crystals += amount;
                    await player.save();
                    await member.send({content: `You received ${amount} 💎 from ${interaction.user.username} on ${interaction.guild.name} server`});
                    return interaction.reply({content: `Gave ${amount} 💎 to ${user.username}`, ephemeral: true});
                }
                else{
                    return interaction.reply({content: `Player not found`, ephemeral: true});
                }
            } catch (e) {
                console.log(e)
            }
        }
    },


    async executeButton(interaction, client, id) {
        try {
            const guild = await Guilds.findOne({id: interaction.guild.id});
            const player = await Player.findOne({discordId: interaction.user.id});
            const item = guild.shop.items.find(i => i.id === id);
            if(player){
                if(player.items.find(i => i.id === id)) {
                    interaction.reply({content: `You already have this item`, ephemeral: true});

                }
                else if (item.donator && !player.isDonator){
                    interaction.reply({content: `You must be a sponsor to buy this item`, ephemeral: true});
                }
                else{
                    if (player.crystals >= item.price) {
                        player.crystals -= item.price;
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
                            source: "shop"
                        })
                        await player.save();
                        interaction.reply({content: `You bought ${item.title} for ${item.price} 💎\nYou have ${player.crystals} 💎 now`, ephemeral: true});
                        await purchases(client)


                    }
                    else {
                        interaction.reply({content: `You don't have enough crystals`, ephemeral: true});
                    }
                }
            }else {
                interaction.reply({content: `You must verify first`, ephemeral: true});
            }





        }catch (e) {
            console.log(e)
        }

    }


}