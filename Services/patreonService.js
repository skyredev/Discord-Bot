const {sendRequest, getJSONResponse} = require("./requestServices");
const {request} = require('undici');
const crypto = require('crypto');
const _ = require("lodash");
const {codeBlock} = require("discord.js");
const Guilds = require('../Models/Guilds');

//The service to check the patreon page for changes and send a message to the channel if there are any changes detected

async function  requestPatreon() {
    try{// Hardcoded link to patreon cause of it was made for one exact discord server
        const response = await request('https://www.patreon.com/api/campaigns/8025193?include=reward_items.null%2Crewards.items.null%2Creward_items.reward_item_configuration.campaign_installation%2Creward_items.template&fields[reward]=[]&fields[reward-item]=created_at%2Cends_at%2Ctte_interval%2Crule_type&json-api-use-default-includes=false&json-api-version=1.0');
        const {data} = await getJSONResponse(response.body);

        const campaign_pledge_sum = data.attributes.campaign_pledge_sum
        const exactly_sum =campaign_pledge_sum/100
        const patron_count = data.attributes.patron_count

        console.log(exactly_sum, patron_count)
        return {exactly_sum, patron_count}

    }
    catch(e){
        console.log(e)
    }

}


async function  checkPatreon(client) {

        const allGuilds = await Guilds.find({ "patreon.channel.id": { $ne: null } });

        const content =  await requestPatreon( )
        if ( !content) return

        const hash = crypto.createHash('md5').update( JSON.stringify(content)).digest('hex')


        try {
            for (let i = 0; i < allGuilds.length; i++) {
                try {
                    const guild = allGuilds[i]
                    if (guild.patreon.hash !== hash && guild.patreon.status !== false) {
                        const channel = client.channels.cache.get(guild.patreon.channel.id)
                        const thisGuild = client.guilds.cache.get(guild.id)
                        const thisRole = thisGuild.roles.cache.find(role => role.id === guild.patreon.ping)
                        console.log(`New Patreon content ${guild.id}  ${thisRole}`)
                        if (guild.patreon.ping && thisRole !== undefined) {
                            await sendRequest(client, channel, `<@&${guild.patreon.ping}>` + codeBlock("fix", `Patreon changes detected: \n \n Earning per month: ${content.exactly_sum} \n Patrons: ${content.patron_count}`))
                        } else {
                            await sendRequest(client, channel, codeBlock("fix", `Patreon changes detected: \n \n Earning per month: ${content.exactly_sum} \n Patrons: ${content.patron_count}`))

                        }
                    }
                    guild.patreon.hash = hash
                    await guild.save()
                } catch (e) { console.log(e)
                }
            }

        }catch(e){
        }




}

module.exports={ checkPatreon };