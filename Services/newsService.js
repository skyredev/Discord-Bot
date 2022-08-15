const { JSDOM } = require("jsdom");
const _ = require("lodash");
const {sendRequest, getTextResponse} = require("./requestServices");
const {getConfig, saveConfig} = require("./configService");
const {request} = require('undici');
const {codeBlock} = require("discord.js");
const crypto = require('crypto');

async function  requestWebSite() {
        try{
            const response = await request('https://sites.google.com/view/commandersconflict/patch-notes?authuser=0');
            const text = await getTextResponse(response.body);
            const dom = new JSDOM(text);
            const main = dom.window.document.querySelector("div[role=main]")

            const sections = main.querySelectorAll("section")

            return sections[2].textContent

        }
        catch(e){
            console.log(e)
        }

}


 async function  checkWebSite(client) {

     const config = getConfig()
    const newsChannels =  _.flatten(  Object.keys( config.guilds ).map( guildId => {
        try {
            return { ...config.guilds[guildId].news.Channel, guildId}
        }catch (e){
            console.error(e)
        }

    }))

     const content =  await requestWebSite( )
     if(!content) return

     const hash = crypto.createHash('md5').update( JSON.stringify(content)).digest('hex')

     try {
         return Promise.all(newsChannels.map(channel => {
             try{
                 if(config.guilds[channel.guildId].news.Hash !== hash && config.guilds[channel.guildId].news.Status !== false){
                     console.log("New Website content")
                     sendRequest(client, channel, codeBlock("fix", `Website changes detected: \n \n ${content}`))
                 }
                 config.guilds[channel.guildId].news.Hash = hash
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

module.exports={ checkWebSite };