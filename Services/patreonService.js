
const {sendRequest, getJSONResponse} = require("./requestServices");
const {getConfig, saveConfig} = require("./configService");
const {request} = require('undici');
const crypto = require('crypto');
const _ = require("lodash");
const {codeBlock} = require("discord.js");
const {Client} = require('discord.js');

async function  requestPatreon() {
    try{
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
        const config = getConfig()

        const patreonChannels =  _.flatten(  Object.keys( config.guilds ).map( guildId => {
            try {
                return { ...config.guilds[guildId].patreon.Channel, guildId}
            }catch (e){
                console.error(e)
            }
        }))

        const content =  await requestPatreon( )
        if ( !content) return

        const hash = crypto.createHash('md5').update( JSON.stringify(content)).digest('hex')


        try {
            return Promise.all(patreonChannels.map(channel => {
                try{
                    if(config.guilds[channel.guildId].patreon.Hash !== hash && config.guilds[channel.guildId].patreon.Status !== false){
                        const thisGuild = client.guilds.cache.get(channel.guildId)
                        const thisRole = thisGuild.roles.cache.find(role => role.id === config.guilds[channel.guildId].patreon.Ping)
                        console.log(`New Patreon content ${channel.guildId}  ${thisRole}`)
                        if(config.guilds[channel.guildId].patreon.Ping && thisRole !== undefined){
                            sendRequest(client, channel, `<@&${config.guilds[channel.guildId].patreon.Ping}>`+codeBlock("fix", `Patreon changes detected: \n \n Earning per month: ${content.exactly_sum} \n Patrons: ${content.patron_count}` ))
                        }else {
                            sendRequest(client, channel, codeBlock("fix", `Patreon changes detected: \n \n Earning per month: ${content.exactly_sum} \n Patrons: ${content.patron_count}` ))

                        }
                    }
                    config.guilds[channel.guildId].patreon.Hash = hash
                }catch (e){
                    console.error(e)
                }

            }))
        }catch(e){
            console.error(e)
        }
        finally {
            saveConfig(config)
        }



}

module.exports={ checkPatreon };