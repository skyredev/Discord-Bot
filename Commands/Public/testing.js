const { CommandInteraction } = require('discord.js');
const { MessageEmbed } = require('discord.js'); // Assuming you're using discord.js

const Guilds = require('../../Models/Guilds');
const Player = require('../../Models/Player');

module.exports = { // The shop, where users can by any items you created, includes channel, items setup. Uses Discord Forum and threads to create shop and display items
    name: 'testing',
    raw: {
        name: 'testing',
        description: 'Testing waves management',
        options: [
            {
                "type": 1,
                "name": "channel",
                "description": "Set testing channel",
                "options": [
                    {
                        "type": 7,
                        "name": "channel",
                        "description": "Choose a channel",
                        "required": true,
                        channelTypes: [0]
                    }
                ]
            },
            {
                "type": 1,
                "name": "create",
                "description": "Create a testing wave",
                "options": [
                    {
                        "type": 3,
                        "name": "id",
                        "description": "Wave ID",
                        "required": true,
                    },
                    {
                        "type": 3,
                        "name": "title",
                        "description": "Title",
                        "required": true,
                    },
                    {
                        "type": 3,
                        "name": "description",
                        "description": "Description",
                        "required": true,
                    },
                    {
                        "type": 11,
                        "name": "image",
                        "description": "Image of testing wave (leave empty if no image)",
                        "required": false,
                    },
                    {
                        "type": 4,
                        "name": "limit",
                        "description": "How many users can participate (leave empty if no limit)",
                        "required": false,
                    },
                ],
            },
            {
                "type": 1,
                "name": "edit",
                "description": "Edit a testing wave",
                "options": [
                    {
                        "type": 3,
                        "name": "id",
                        "description": "Wave ID",
                        "required": true,
                    },
                    {
                        "type": 3,
                        "name": "title",
                        "description": "Title",
                        "required": false,
                    },
                    {
                        "type": 3,
                        "name": "description",
                        "description": "Description",
                        "required": false,
                    },
                    {
                        "type": 11,
                        "name": "image",
                        "description": "Image of testing wave (leave empty if no image)",
                        "required": false,
                    },
                    {
                        "type": 4,
                        "name": "limit",
                        "description": "How many users can participate (leave empty if no limit)",
                        "required": false,
                    },
                ],
            },
            {
                "type": 1,
                "name": "end",
                "description": "End a testing wave",
                "options": [
                    {
                        "type": 3,
                        "name": "id",
                        "description": "Wave ID",
                        "required": true,
                    },
                ],
            },
            {
                "type": 1,
                "name": "testingrole",
                "description": "Set testing role!",
                "options": [
                    {
                        "type": 8,
                        "name": "testingrole",
                        "description": "Set testing role!",
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
            {
                "type": 1,
                "name": "testerschannel",
                "description": "Set testers channel",
                "options": [
                    {
                        "type": 7,
                        "name": "testerschannel",
                        "description": "Choose a channel",
                        "required": true,
                        channelTypes: [0]
                    }
                ]
            },
            {
                "type": 1,
                "name": "cleaning",
                "description": "Clean inactive players",
                "options": [
                    {
                        "type": 4,
                        "name": "players",
                        "description": "How many players to clean",
                        "required": true,
                    },
                ]
            }
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

            guild.testing.channel.id = channel.id;
            guild.testing.channel.name = channel.name;
            await guild.save();
            return interaction.reply({content: `Testing channel set to ${channel}`, ephemeral: true});
        }
        if(interaction.options.getSubcommand()==='logchannel') {
            const channel = interaction.options.getChannel('log');
            const guild = await Guilds.findOne({id: interaction.guild.id});

            guild.testing.logChannel.id = channel.id;
            guild.testing.logChannel.name = channel.name;
            await guild.save();
            return interaction.reply({content: `Testing logchannel set to ${channel}`, ephemeral: true});
        }
        if(interaction.options.getSubcommand()==='testerschannel') {
            const channel = interaction.options.getChannel('testerschannel');
            const guild = await Guilds.findOne({id: interaction.guild.id});

            guild.testing.testersChannel.id = channel.id;
            guild.testing.testersChannel.name = channel.name;
            await guild.save();
            return interaction.reply({content: `Testers channel set to ${channel}`, ephemeral: true});
        }

        if(interaction.options.getSubcommand() === 'testingrole') {
            const role = interaction.options.getRole('testingrole');
            const guild = await Guilds.findOne({id: interaction.guild.id});

            guild.testing.testingRole.id = role.id;
            guild.testing.testingRole.name = role.name;
            await guild.save();
            interaction.reply({content: `Testing role set to #${role.name}`, ephemeral: true});
        }
        if(interaction.options.getSubcommand() === 'cleaning') {

            await cleanInactiveTesters(interaction)

            async function cleanInactiveTesters(interaction) {
                const playersToClean = interaction.options.getInteger('players');
                const guild = await Guilds.findOne({ id: interaction.guild.id });
                const testerRoleId = guild.testing.testingRole.id;
                const guildMembers = await interaction.guild.members.fetch();
                guild.testing.cleaning = [];
                await guild.save();

                // Fetch members with tester role
                const testersWithRole = guildMembers.filter(member => member.roles.cache.has(testerRoleId));

                // Check if members exist in the database and sort them
                let sortedTesters = await sortTestersByActivity(testersWithRole);

                const playersToNotify = sortedTesters.slice(0, playersToClean);
                playersToNotify.forEach(player => {
                    guild.testing.cleaning.push(player.member.id);
                })
                await guild.save();

                    // Create and send embed message
                await sendEmbedMessage(interaction, playersToNotify);
                }

            async function sortTestersByActivity(testers) {
                // This function will check the database and sort the testers
                // Pseudocode, adjust according to your database and data structure
                let testersWithStats = [];
                for (const tester of testers) {
                    const playerData = await Player.findOne({ discordId: tester[0] });
                    if (playerData) {
                        testersWithStats.push({
                            member: tester[1].user,
                            timePlayed: playerData.stats.timePlayed,
                            games: playerData.stats.games
                        });
                    } else {
                        testersWithStats.push({ member: tester[1].user, notRegistered: true });
                    }
                }

                // Sorting logic
                testersWithStats.sort((a, b) => {
                    if (a.notRegistered) return -1;
                    if (b.notRegistered) return 1;
                    if (a.timePlayed !== b.timePlayed) return a.timePlayed - b.timePlayed;
                    return a.games - b.games;
                });

                return testersWithStats;
            }

            async function sendEmbedMessage(interaction, players) {
                await interaction.channel.send({
                    embeds: [
                        {
                            type: 'rich',
                            title: `Inactive testers`,
                            description: `**${players.length}** most inactive testers\n${players.map(player => {
                                const playerData = player.notRegistered ? 'Not authorized' : `Time Played: **${player.timePlayed / 60} hours** | Games: **${player.games}**`;
                                return `${players.indexOf(player) + 1}. <@${player.member.id}> - ${playerData}`

                            }).join('\n')}`,
                            color: 0x14cd33,
                        }],
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    style: 4,
                                    label: `Delete all`,
                                    custom_id: `cleaning`,
                                    disabled: false,
                                    type: 2
                                },
                                {
                                    style: 2,
                                    label: `Warn all`,
                                    custom_id: `warning`,
                                    disabled: false,
                                    type: 2
                                },
                            ]
                        }
                    ],
                })
                interaction.reply({content: `Cleaning started`, ephemeral: true});
            }


        }

        else if(interaction.options.getSubcommand()==='create') {
            try {
                const title = interaction.options.getString('title');
                const description = interaction.options.getString('description');
                const image = interaction.options.getAttachment('image');
                const limit = interaction.options.getInteger('limit');
                const id = interaction.options.getString('id');

                const guild = await Guilds.findOne({id: interaction.guild.id});
                if(guild.testing.waves.find(wave => wave.id === `testing_${id}`)) return interaction.reply({content: `Wave with this ID already exists`, ephemeral: true});
                if (guild.testing.channel.id){
                    let channel = await interaction.guild.channels.fetch(guild.testing.channel.id);

                    if(!channel) return interaction.reply({content: `Testing channel not found`, ephemeral: true});
                    else {
                        const message = await channel.send({
                            embeds: [
                                {
                                    type: 'rich',
                                    title: title,
                                    description: description,
                                    fields: [
                                        {
                                            name: `Limit`,
                                            value: limit ? `0/${limit}` : 'No limit'
                                        },
                                    ],
                                    color: 0x14cd33,
                                    footer: {
                                        text: `ID: testing_${id}`
                                    }
                                }],
                            components: [
                                {
                                    type: 1,
                                    components: [
                                        {
                                            style: 3,
                                            label: `Sign up`,
                                            custom_id: `testing_${id}`,
                                            disabled: false,
                                            type: 2
                                        },
                                    ]
                                }
                            ],
                            files: image ? [image.url] : []
                        })

                        const testing = {
                            title: title,
                            description: description,
                            id: `testing_${id}`,
                            limit: limit ? limit : null,
                            image: image ? image.url : null,
                            users : {
                                signed: {
                                    players: [],
                                    count: 0
                                },
                                accepted: {
                                    players: [],
                                    count: 0
                                },
                                rejected: {
                                    players: [],
                                    count: 0
                                },
                            },
                            base: {
                                channel: channel.id,
                                guild: channel.guildId,
                                message: message.id,
                            }
                        }
                        guild.testing.waves.push(testing);
                        await guild.save();

                        return interaction.reply({content: `Testing wave created`, ephemeral: true});
                    }



                } else {
                    return interaction.reply({content: `Testing channel not set`, ephemeral: true});
                }
            } catch (e) {
                console.log(e)
            }
        }

        else if(interaction.options.getSubcommand()==='edit') {

            try {
                const id = interaction.options.getString('id');
                const title = interaction.options.getString('title');
                const description = interaction.options.getString('description');
                const image = interaction.options.getAttachment('image');
                const limit = interaction.options.getInteger('limit');


                const guild = await Guilds.findOne({id: interaction.guild.id});
                let wave = guild.testing.waves.find(wave => wave.id === id);
                const index = guild.testing.waves.indexOf(wave);
                if (!wave) return interaction.reply({content: `Wave not found`, ephemeral: true}); //return if item not found

                    if (guild.testing.channel.id) {
                        let channel = await interaction.guild.channels.fetch(wave.base.channel)

                            if (channel) {
                                let message = await channel.messages.fetch(wave.base.message);

                                wave = {
                                    title: title === null ? wave.title : title,
                                    description: description === null ? wave.description : description,
                                    limit: limit === null ? wave.limit : limit,
                                    id: `${wave.id}`,
                                    users: wave.users,
                                    image: image === null ? wave.image : image.url,
                                    base: {
                                        channel: channel.id,
                                        guild: channel.guildId,
                                        message: message.id,
                                    }
                                }
                                guild.testing.waves[index] = wave;
                                await guild.save();

                                await message.edit({
                                    embeds: [
                                        {
                                            type: 'rich',
                                            title: wave.title,
                                            description: wave.description,
                                            fields: [
                                                {
                                                    name: `Limit`,
                                                    value: wave.limit ? `${wave.users.accepted.count}/${wave.limit}` : 'No limit'
                                                },
                                            ],
                                            color: 0x14cd33,
                                            footer: {
                                                text: `ID: ${wave.id}`
                                            }
                                        }],
                                    components: [
                                        {
                                            type: 1,
                                            components: [
                                                {
                                                    style: 3,
                                                    label: `Sign up`,
                                                    custom_id: `${wave.id}`,
                                                    disabled: false,
                                                    type: 2
                                                },
                                            ]
                                        }
                                    ],
                                    files: wave.image ? [wave.image] : []
                                })




                                return interaction.reply({content: `Testing wave updated`, ephemeral: true});


                            } else {
                                return interaction.reply({content: `Testing channel not found`, ephemeral: true});
                            }
                    } else {
                        return interaction.reply({content: `Testing channel not set`, ephemeral: true});
                    }
            } catch (e) {
                console.log(e)
            }
        }

        else if(interaction.options.getSubcommand()==='end') {
            try{
                const id = interaction.options.getString('id');
                const guild = await Guilds.findOne({id: interaction.guild.id});
                let wave = guild.testing.waves.find(wave => wave.id === id);
                const index = guild.testing.waves.indexOf(wave);
                if(!wave) return interaction.reply({content: `Wave not found`, ephemeral: true});

                if (guild.testing.channel.id) {
                    let channel = await interaction.guild.channels.fetch(wave.base.channel)

                    if (channel) {
                        let message = await channel.messages.fetch(wave.base.message);

                        await message.edit({
                            embeds: [
                                {
                                    type: 'rich',
                                    title: wave.title,
                                    description: wave.description,
                                    fields: [
                                        {
                                            name: `Limit`,
                                            value: wave.limit ? `${wave.users.accepted.count}/${wave.limit}` : 'No limit'
                                        },
                                    ],
                                    color: 0xcd143c,
                                    footer: {
                                        text: `ID: ${wave.id}`
                                    }
                                }],
                            components: [
                                {
                                    type: 1,
                                    components: [
                                        {
                                            style: 3,
                                            label: `Wave ended`,
                                            custom_id: `${wave.id}`,
                                            disabled: true,
                                            type: 2
                                        },
                                    ]
                                }
                            ],
                            files: wave.image ? [wave.image] : []
                        })


                        return interaction.reply({content: `Testing wave updated`, ephemeral: true});


                    } else {
                        return interaction.reply({content: `Testing channel not found`, ephemeral: true});
                    }
                } else {
                    return interaction.reply({content: `Testing channel not set`, ephemeral: true});
                }

            }catch (e) {
                console.log(e)
            }



        }
    },

    async executeButton(interaction, client, id) {
        if (id.startsWith('testing_')) {
            try {
                const guild = await Guilds.findOne({ id: interaction.guild.id });
                const wave = guild.testing.waves.find(i => i.id === id);
                if (!wave) return interaction.reply({ content: `Testing wave not found!`, ephemeral: true });

                if (wave.users.signed.players.find(i => i.discordId === interaction.user.id)) {
                    interaction.reply({ content: `You already signed up for this testing wave!`, ephemeral: true });
                }
                else if (wave.limit && wave.users.accepted.count >= wave.limit) {
                    interaction.reply({ content: `Testing wave is full!`, ephemeral: true });
                }
                else {
                    wave.users.signed.players.push({
                        discordId: interaction.user.id,
                        discordName: interaction.user.username,
                    })
                    wave.users.signed.count++;
                    guild.testing.waves[guild.testing.waves.indexOf(wave)] = wave;

                    const channel = await interaction.guild.channels.fetch(guild.testing.logChannel.id);
                    const message = await channel.send({
                        embeds: [
                            {
                                type: 'rich',
                                title: `New testing wave sign up!`,
                                description: `**${interaction.user.username}** signed up for **${wave.title}** <@${interaction.user.id}>`,
                                fields: [
                                    {
                                        name: `Limit`,
                                        value: wave.limit ? `${wave.users.accepted.count}/${wave.limit}` : 'No limit'
                                    },
                                ],
                                color: 0x14cd33,
                                footer: {
                                    text: `ID: ${wave.id}`
                                }
                            }],
                        components: [
                            {
                                type: 1,
                                components: [
                                    {
                                        style: 3,
                                        label: `Accept`,
                                        custom_id: `accept_${wave.id}_${interaction.user.id}`,
                                        disabled: false,
                                        type: 2
                                    },
                                    {
                                        style: 4,
                                        label: `Reject`,
                                        custom_id: `reject_${wave.id}_${interaction.user.id}`,
                                        disabled: false,
                                        type: 2
                                    },
                                ]
                            }
                        ],
                    })
                    await guild.save();
                    interaction.reply({ content: `You signed up for this testing wave!`, ephemeral: true });
                }
            } catch (e) {
                console.log(e)
            }
        }
        else if (id.startsWith('accept_') || id.startsWith('reject_')) {
            try {
                const guild = await Guilds.findOne({ id: interaction.guild.id });
                const wave = guild.testing.waves.find(i => i.id === `testing_${id.split('_')[2]}`);
                const member = await interaction.guild.members.fetch(id.split('_')[3]);
                if (!wave) return interaction.reply({ content: `Testing wave not found!`, ephemeral: true });

                if (wave.users.accepted.players.find(i => i.discordId === member.id)) {
                    interaction.reply({ content: `You already accepted this user!`, ephemeral: true });
                }
                else if (wave.users.rejected.players.find(i => i.discordId === member.id)) {
                    interaction.reply({ content: `You already rejected this user!`, ephemeral: true });
                }
                else {
                    const type = id.split('_')[0];

                    if (type === 'accept') {
                        wave.users.accepted.players.push({
                            discordId: member.id,
                            discordName: member.user.username,
                        })
                        wave.users.accepted.count++;
                        guild.testing.waves[guild.testing.waves.indexOf(wave)] = wave;

                        await member.roles.add(guild.testing.testingRole.id);
                        await member.send({ content: `✅ Congratulations, you have been accepted as a tester on **${interaction.guild.name}**! server!` });
                        await guild.save();

                        if (guild.testing.channel.id) {
                            let channel = await interaction.guild.channels.fetch(wave.base.channel);

                            if (channel) {
                                let message = await channel.messages.fetch(wave.base.message);

                                await message.edit({
                                    embeds: [
                                        {
                                            type: 'rich',
                                            title: wave.title,
                                            description: wave.description,
                                            fields: [
                                                {
                                                    name: `Limit`,
                                                    value: wave.limit ? `${wave.users.accepted.count}/${wave.limit}` : 'No limit'
                                                },
                                            ],
                                            color: wave.limit && wave.users.accepted.count >= wave.limit ? 0xcd143c : 0x14cd33,
                                            footer: {
                                                text: `ID: ${wave.id}`
                                            }
                                        }],
                                    components: [
                                        {
                                            type: 1,
                                            components: [
                                                {
                                                    style: 3,
                                                    label: wave.limit && wave.users.accepted.count >= wave.limit ? `Wave ended` : `Sign up`,
                                                    custom_id: `${wave.id}`,
                                                    disabled: wave.limit && wave.users.accepted.count >= wave.limit,
                                                    type: 2
                                                },
                                            ]
                                        }
                                    ],
                                    files: wave.image ? [wave.image] : []
                                });
                            }

                            interaction.reply({ content: `✅ <@${interaction.user.id}> accepted <@${member.id}> as a tester!`, ephemeral: false });
                            setTimeout(() => {
                                interaction.message.delete();
                            }, "500");
                        }
                    } else if (type === 'reject') {
                        wave.users.rejected.players.push({
                            discordId: member.id,
                            discordName: member.user.username,
                        })
                        wave.users.rejected.count++;
                        guild.testing.waves[guild.testing.waves.indexOf(wave)] = wave;
                        await member.send({ content: `❌ Unfortunately your application for testing on **${interaction.guild.name}** was not accepted!` });
                        await guild.save();
                        interaction.reply({ content: `❌ <@${interaction.user.id}> rejected <@${member.id}> from testing!`, ephemeral: false });
                        setTimeout(() => {
                            interaction.message.delete();
                        }, "500");
                    }
                }
            } catch (e) {
                console.log(e)
            }
        }
        else if (id.startsWith('cleaning')) {
            try {
                const guild = await Guilds.findOne({ id: interaction.guild.id });
                const testers = guild.testing.cleaning;
                const guildMembers = await interaction.guild.members.fetch();
                const testerRoleId = guild.testing.testingRole.id;

                for (const tester of testers) {
                    const member = guildMembers.get(tester);
                    if (member) {
                        await member.roles.remove(testerRoleId);
                        try {
                            await member.send({ content: `❌ You have been removed from testers on **${interaction.guild.name}** due to inactivity!` });
                        }catch (e) {
                            console.log(e)
                        }
                    }
                }

                guild.testing.cleaning = [];
                await guild.save();
                interaction.reply({ content: `✅ Cleaning completed! All testers from list were removed`, ephemeral: true });
            } catch (e) {
                console.log(e)
            }
        }
        else if (id.startsWith('warning')){
            try {
                const guild = await Guilds.findOne({ id: interaction.guild.id });
                const testers = guild.testing.cleaning;
                const testerChannelId = guild.testing.testersChannel.id;

                let channel = testerChannelId ? await interaction.guild.channels.fetch(testerChannelId) : interaction.channel;
                if(!channel) return interaction.reply({ content: `Testers channel not found`, ephemeral: true});

                await interaction.message.edit({
                    embeds: interaction.message.embeds,
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    style: 4,
                                    label: `Delete all`,
                                    custom_id: `cleaning`,
                                    disabled: false,
                                    type: 2
                                },
                            ]
                        }
                    ],

                })

                await channel.send ({
                    content: `${testers.map(tester => `<@${tester}>`).join(' ')} you have been warned for inactivity and will be removed from testers if your activity will not increase!`
                    })
                interaction.reply({ content: `✅ Warning sent!`, ephemeral: true });

            } catch (e) {
                console.log(e)
            }

        }
    }
}