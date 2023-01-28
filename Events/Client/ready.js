const { Client } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    /**
     *
     * @param { Client } client
     */
    async execute(client){
        client.user.setActivity(`Commanders Conflict`, { type: 5 });
        //send message

        console.log(`Logged in as ${client.user.username}!`)
    }
}