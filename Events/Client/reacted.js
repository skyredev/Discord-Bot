const { Client } = require('discord.js');

module.exports = {
    name: 'messageReactionAdd',
    once: false,
    rest: false,
    /**
     * @param { MessageReaction } reaction
     */
    async execute(reaction, client) {
        // When a reaction is received, check if the structure is partial
        if (reaction.partial) {
            // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Something went wrong when fetching the message:', error);
                // Return as `reaction.message.author` may be undefined/null
                return;
            }
        }


        try {
          if(reaction.emoji.name=== '🔄' && reaction.message.author.id === reaction.client.user.id && reaction.message.content==='' && reaction.message.embeds[0].footer.text.startsWith('ID: ') && reaction.count>1){  // If the reaction is a refresh button for link catched message it will refresh the message
                let getRefLink= reaction.message.embeds[0].fields.find(f => f.name === "\u200B").value.match(/\[Jump to message!\]\((.*)\)/)[1]

                const match = (/https:\/\/discord\.com\/channels\/\d{15,21}\/(\d{15,21})\/(\d{15,21})/gm).exec(getRefLink)

                let target = null;
                let timeStamp = null;

                    if (match && match[1] && match[2]) {
                        target = {channelId: match[1], messageId: match[2]};
                    }

                if (target !== null) {
                        const channel = await reaction.client.channels.fetch(target.channelId)
                        const messageRef = await channel.messages.fetch(target.messageId)

                    if(messageRef.editedTimestamp===null){
                        await reaction.message.reactions.removeAll();
                        await reaction.message.react('🔄')
                        return;
                    }
                    await reaction.message.edit({
                        embeds: [
                            {
                                "type": "rich",
                                "title": "",
                                "description": `*"${messageRef.content}" (edited)*`,
                                "color": 0xff00c3,
                                "fields": [
                                    {
                                        "name": "\u200B",
                                        "value":`**[Jump to message!](${messageRef.url})**`,
                                    }
                                ],
                                "author": {
                                    "name": `${messageRef.author.username}#${messageRef.author.discriminator}`,
                                    "icon_url": `${messageRef.author.avatarURL()}`
                                },
                                "footer": {
                                    "text": `ID: ${messageRef.id} |edited at ${messageRef.editedAt.toLocaleString()}`
                                }
                            }
                        ]
                    })
                    await reaction.message.reactions.removeAll();
                    await reaction.message.react('🔄')
                }






                }
        } catch (error) {
            console.error(error)
        }

    }
}