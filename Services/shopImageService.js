const Guilds = require('../Models/Guilds');

async function updateShopImage(client) {
    const guilds = await Guilds.find({ $exist : { shop: true } } );
    await Promise.all(guilds.map(async guild => {
        const shop = guild.shop
        for(let i = 0; i < shop.items.length; i++) {
            const item = shop.items[i]
            await getShopImage(item, shop, guild, client)
        }
    }))

    async function getShopImage(item, shop, guild, client) {
        try{
            const thisGuild = client.guilds.cache.get(guild.id)
            let channel = await thisGuild.channels.cache.get(item.base.channel)
            let message = await channel.messages.fetch(item.base.channel);
            await message.edit({
                embeds: [
                    {
                        type: 'rich',
                        title: item.title,
                        description: item.description,
                        image: {
                            url: message.embeds[0].data.image.proxy_url,
                            width: 0,
                            height: 0
                        },
                        color: message.embeds[0].data.color,
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
            })
        }catch (e) {
            console.log(e)
        }


    }
}

module.exports = { updateShopImage }