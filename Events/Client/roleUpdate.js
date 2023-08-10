const { Client } = require('discord.js');
const Player = require('../../Models/Player');
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
    async execute(oldMember, newMember, client) {
        try {
            const guildDB = await Guilds.findOne({ id: newMember.guild.id });
            const role = guildDB.verify.donatorRole.id;
            const aliasRoles = guildDB.verify.aliasRoles;
            const player = await Player.findOne({ discordId: newMember.id });


            // Проверка наличия или отсутствия роли
            const hasDonatorRole = newMember.roles.cache.has(role);
            const hadDonatorRole = oldMember.roles.cache.has(role);
            const hasAnyAliasRole = aliasRoles.some(r => newMember.roles.cache.has(r));

            if (hasDonatorRole && player) {
                player.isDonator = true;
                await player.save();

            } else if (hasAnyAliasRole && !hadDonatorRole) {
                await newMember.roles.add(role);
                console.log('add')
            }
            if(newMember.roles.cache.size < oldMember.roles.cache.size) {
                if (!hasAnyAliasRole) {
                    await newMember.roles.remove(role);
                    console.log('remove')
                    if(player) {
                        player.isDonator = false;
                        await player.save();
                    }
                }
            }
            // Если у участника нет роли спонсора и ни одной из alias ролей



        } catch (e) {
            console.error("Ошибка при обновлении роли: ", e);
        }
    }
}