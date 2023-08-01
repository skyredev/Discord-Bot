const { request } = require('undici');
const express = require('express');
const { clientId, clientSecret, port, redirectUrl, discordUrl } = require('./tokens.json');
const {verifyUser} = require('./Services/dataBaseServices');
const {getUser} = require("./Services/dataBaseServices");

function init(client) {

    const app = express();
    app.get('/', async ({ query }, response) => {
        const { code } = query;

        if (code) {
            try {
                const tokenResponseData = await request('https://discord.com/api/oauth2/token', {
                    method: 'POST',
                    body: new URLSearchParams({
                        client_id: clientId,
                        client_secret: clientSecret,
                        code,
                        grant_type: 'authorization_code',
                        redirect_uri: `${redirectUrl}`,
                    }).toString(),
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                });

                const oauthData = await tokenResponseData.body.json();
                let userInfo = await request('https://discord.com/api/users/@me', {
                    headers: {
                        authorization: `${oauthData.token_type} ${oauthData.access_token}`,
                    },
                });
                let connectionsInfo = await request('https://discord.com/api/users/@me/connections', {
                    headers: {
                        authorization: `${oauthData.token_type} ${oauthData.access_token}`,
                    },
                });
                const guild = JSON.parse(atob(query.state)).id;

                userInfo = await userInfo.body.json();
                connectionsInfo = await connectionsInfo.body.json();
                await getUser(userInfo, guild, client)
                await verifyUser(userInfo, connectionsInfo, client, guild);


            } catch (error) {
                console.error(error);
                return (response.text(error.stack))
            }
        }

        return (response.redirect(`${discordUrl}`)); // Redirect to your server / Hardcoded link to one exact server
    });
    app.listen(port, () => console.log(`App listening at ${redirectUrl}`));
}

module.exports = init;