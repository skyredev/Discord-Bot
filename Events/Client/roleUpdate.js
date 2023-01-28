const { Client } = require('discord.js');
const Player = require('../../Models/Player');
const Discord = require('../../Models/Discord');
const Guilds = require('../../Models/Guilds');

module.exports = {
    name: 'guildMemberUpdate',
    once: false,
    /**
     *
     * @param { Client } client
     * @param { GuildMember } oldMember
     * @param { GuildMember } newMember
     */
    async execute(oldMember, newMember, client ){ // Checks if the user has the donator role and if they do, it adds the donator role to the database
        try{
            const guildDB = await Guilds.findOne({id: newMember.guild.id});
            const guild = newMember.guild;
            const role = guildDB.verify.donatorRole.id;
            const user = await Discord.findOne({id: newMember.id});
            const player = await Player.findOne({battleTag: user.battleTag});

            if ((oldMember.roles.cache.size > newMember.roles.cache.size) || (oldMember.roles.cache.size < newMember.roles.cache.size)) {
                if(newMember.roles.cache.has(role)){
                    if(user){
                        user.isDonator = true;
                        await user.save();
                    }
                    if(player){
                        player.isDonator = true;
                        await player.save();
                    }


                }
                else{
                    if(user){
                        user.isDonator = false;
                        await user.save();
                    }
                    if(player){
                        player.isDonator = false;
                        await player.save();
                    }
                }

            }
        }catch (e) {
        }


    }
}