const { JSDOM } = require("jsdom");
const _ = require("lodash");
const {sendRequest, getTextResponse} = require("./requestServices");
const {request} = require('undici');
const {codeBlock} = require("discord.js");
const crypto = require('crypto');
const Guilds = require('../Models/Guilds');

async function requestWebSite(link) {// Deprecated/Not used anymore
        try{
            const response = await request(`${link}`);
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


 async function checkWebSite(client, link) {


    const newsChannels =  await Guilds.find({ "news.channel.id": { $ne: null } });

     const content =  await requestWebSite( link )
     if(!content) return

     const hash = crypto.createHash('md5').update( JSON.stringify(content)).digest('hex')

     try {
         for(let i = 0; i < newsChannels.length; i++) {
             try {
                 const guild = newsChannels[i]
                 if (guild.news.hash !== hash && guild.news.status !== false) {
                     const channel = client.channels.cache.get(guild.news.channel.id)
                     console.log("New Website content")
                     await sendRequest(client, channel, codeBlock("fix", `Website changes detected: \n \n ${content}`))
                 }
                 guild.news.hash = hash
                 await guild.save()
             } catch (e) {
                 console.error(e)
             }
         }
     }catch(e){
         console.error(e)
     }



}

module.exports={ checkWebSite };