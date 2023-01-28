const { Client } = require('discord.js');
const {request} = require("undici");
const {getJSONResponse} = require("../../Services/requestServices");

module.exports = {
    name: 'messageCreate',
    once: false,
    rest:false,
    /**
     *
     * @param { Message } message
     */
    async execute(message, client){
        try {

            const matches = message.content.matchAll(/https:\/\/discord\.com\/channels\/\d{15,21}\/(\d{15,21})\/(\d{15,21})/gm);

            const targets = [];
            for (const match of matches) {
                if (match && match[1] && match[2]) {
                    targets.push({channelId: match[1], messageId: match[2]});
                }
            }
            if (targets.length > 0) {
                const length = targets.length;
                const messages = await Promise.all(targets.map(async target => {
                    const channel = await client.channels.fetch(target.channelId)
                    return channel.messages.fetch(target.messageId)

                }))

                for (let i = 0; i < length; i++) {
                    const messageRef = messages[i];
                    let description = `*"${messageRef.content}"*`;
                    if(messageRef.embeds[0]!==undefined){
                        description = `*"${messageRef.content}"\n${messageRef.embeds[0].title}\n${messageRef.embeds[0].description}*`
                    }
                    if (messageRef) {
                        message.channel.send({
                            embeds: [
                                {
                                    "type": "rich",
                                    "title": "",
                                    "description": `${description}`,
                                    "color": 0xff00c3,
                                    "fields": [
                                        {
                                            "name": "\u200B",
                                            "value":`**[Jump to message!](${messageRef.url})**`,
                                        }
                                    ],
                                    "author": {
                                        "name": `${messageRef.author.username}#${messageRef.author.discriminator}`,
                                        "icon_url": `${messageRef.author.displayAvatarURL()}`
                                    },
                                    "footer": {
                                        "text": `ID: ${messageRef.id} | ${messageRef.createdAt.toLocaleString()}`
                                    }
                                }
                            ]
                        })
                            .then(createdMsg => {
                                createdMsg.react("🔄")
                            })

                    }
                }
            }
        }
        catch (e){
            console.error(e)
        }

    }
}