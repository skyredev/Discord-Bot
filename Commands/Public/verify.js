const { SlashCommandBuilder, CommandInteraction, PermissionFlagsBits, codeBlock} = require('discord.js');
const { ip, port } = require('../../tokens.json');

module.exports = { // Creates message with the link button for verification, the link uses discord OAuth2 to get the user's identity and 3rd party connections (Battle.net) then uses server side verification to verify the user
    name: 'verify',
    disabled:false,
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Verification create!')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false)
    ,

    /**
     *
     * @param { CommandInteraction } interaction
     */

    async execute(interaction) {
        const member = interaction.member
        let guild = { "id": `${interaction.guild.id}`, "member": `${member}`
        }
        guild = btoa((JSON.stringify(guild)));
        return interaction.reply({
            "content": "",
            "tts": false,
            "components": [
                {
                    "type": 1,
                    "components": [
                        {
                            "style": 5,
                            "label": `VERIFY`,
                            "url" : `https://discord.com/api/oauth2/authorize?client_id=1010155156815499404&state=${guild}&redirect_uri=http%3A%2F%2F${ip}%3A${port}&response_type=code&scope=identify%20connections`,
                            "disabled": false,
                            "type": 2
                        },
                    ]
                }
            ],
            "embeds": [
                {
                    "type": "rich",
                    "title": `Verification`,
                    "description": `Verify you BNet to get full access to statistics and your profile\n Click on the button below to verify your account 
                    \n*Please note that you will need to have your BNet account connected to your Discord account and connection must be public*`,
                    "color": 0x6fff00
                }
            ]
            , ephemeral: false});

    },

}