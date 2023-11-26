const { SlashCommandBuilder, CommandInteraction, PermissionFlagsBits, codeBlock} = require('discord.js');
const { bnetId, redirectUrl } = require('../../tokens.json');
const { v4: uuidv4 } = require('uuid');
const {qname} = require("jsdom/lib/jsdom/living/helpers/validate-names");
const Guilds = require('../../Models/Guilds');
const {content} = require("googleapis/build/src/apis/content");

module.exports = { // Creates message with the link button for verification, the link uses discord OAuth2 to get the user's identity and 3rd party connections (Battle.net) then uses server side verification to verify the user
    name: 'authorize',
    disabled:false,
    data: new SlashCommandBuilder()
        .setName('authorize')
        .setDescription('Authorization create!')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false)
    ,

    /**
     *
     * @param { CommandInteraction } interaction
     */

    async execute(interaction) {
        const member = interaction.member

        return interaction.reply({
            "content": "",
            "tts": false,
            "components": [
                {
                    "type": 1,
                    "components": [
                        {
                            "style": 3,
                            "label": `Join game tracking`,
                            customId: `bnetauth`,
                            "disabled": false,
                            "type": 2
                        },
                    ]
                }
            ],
            "embeds": [
                {
                    "type": "rich",
                    "title": `Game statistics tracking & reward system`,
                    "description": `Once you become verified all your games from https://discord.com/channels/748898705452564580/1136090314969460797 are stored in our data base. It allows us to track activity and identify players using their BNet ID.
                     In future we are planning to give benefits and rewards with it.\n 
                     Authorize with your Battle.net to track your match played
                     Click on the button below to verify via authorization your account
                    \n**Please note that if you create new Starcraft II game profile on other region you will need to reauthorize your account**\n`,
                    "color": 0x6fff00
                }
            ]
            , ephemeral: false});

    },
    async executeButton(interaction) {
        const member = interaction.member
        const guild = await Guilds.findOne({id: interaction.guild.id});
        const uuid = uuidv4();
        console.log(uuid);
        let state = { "id": `${interaction.guild.id}`, "userName": `${member.user.username}`, "userId": `${member.user.id}`, "uuid": `${uuid}`
        }
        state = btoa((JSON.stringify(state)));

        // autoexpire link after 5 minutes


        const oauthURL = `https://oauth.battle.net/oauth/authorize?response_type=code&client_id=${bnetId}&redirect_uri=${redirectUrl}/auth&scope=sc2.profile&state=${state}`;

        // Embed the OAuth URL into the Battle.net login URL using the ref parameter
        const loginURL = `https://account.battle.net/login/en/?ref=${encodeURIComponent(oauthURL)}&app=oauth`;

        interaction.reply({
            "content": "",
            "tts": false,
            "components": [
                {
                    "type": 1,
                    "components": [
                        {
                            "style": 5,
                            "label": `AUTHORIZE`,
                            "url": loginURL,
                            "disabled": false,
                            "type": 2
                        },
                    ]
                }
            ],
            "embeds": [
                {
                    "type": "rich",
                    "title": `Authorization`,
                    "description": `Here is your authorization link,\n
                    Please click on the button below to redirect to Battle.net login page and authorize your account
                    \n**Authorization occurs on official Blizzard Entertainment website account.battle.net and is completely safe, we will not store any of your sensitive information or have access to your password or any other personal information**
                    \n*Resurgence of the Storm is not affiliated with Blizzard Entertainment, Inc. in any way*`,
                    "color": 0x6fff00
                }
            ]
            , ephemeral: true});

        return setTimeout(async () => {
            if(guild.authLinks.includes(uuid)){
                return;
            }
            console.log(`adding ${uuid} to ${interaction.guild.id}`)
            guild.authLinks.push(uuid);
            await guild.save();
        }, 1000 * 60 * 10); // 5 minutes
    }

}