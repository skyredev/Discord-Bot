const express = require('express');
const { port, redirectUrl, discordUrl, bnetId, bnetSecret } = require('./tokens.json');
const {authUser} = require('./Services/dataBaseServices');
const { google } = require('googleapis');
const path = require("path");
const axios = require('axios');
const Guilds = require('./Models/Guilds');
const rateLimit = require("express-rate-limit");
const asyncMiddleware = require('./Services/async');

const keyFile = path.join(__dirname, 'service.json');
const key = require(keyFile);
let accessToken = null;
const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});


const FOLDER_ID = '1Vt-RIGuQoQx_zZivHaC753dACZYGeovG';
const FOLDER_PATCHER = '1aFyXPlDKqp7Zo6Lnn9VxNVOxFE9mOkLI';
const version = require('./package.json').version;
function driveInit() {
    return google.drive({ version: 'v3', auth});
}


async function getFolder(folderId, filesPackage, currentPath = '',  ) {
    try {
        const response = await driveInit().files.list({
            q: `'${folderId}' in parents and trashed=false`,
            fields: 'files(id, name, mimeType, size, md5Checksum)',
        });
        const files = response.data.files;
        for (const file of files) {
            //console.log( path.join(currentPath, file.name) )
            if (file.mimeType === 'application/vnd.google-apps.folder') {
                await getFolder(file.id, filesPackage, path.join(currentPath, file.name));
                //check if subfolder name is



            } else {
                // If the local file doesn't exist, or the MD5 checksums don't match, then add the file size to totalSize
                filesPackage.totalSize += parseInt(file.size);

                filesPackage.files.push({ name: file.name, size: parseInt(file.size), id: file.id, path: path.join(currentPath, file.name), md5Checksum:file.md5Checksum });
            }

        }
    } catch (err) {
        console.error('Error fetching files:', err);
        return 0;
    }
}

function init(client) {

    const app = express();

    app.use((err, req, res, next) => {
        if ( process.env.LOG_ERRORS_TO_CONSOLE) {
            if( err.data )
                console.error( err, err.stack, (err.data && err.data.error && err.data.error.description) );
            else
                console.error( err );
        }
        let errors = err.errors || ( err.data && err.data.errors )
        if (!err) next()


        //ErrorUtil.Raven().captureException(err, {req: req});
        res.err = err;
        res.status(err.status ||  err.statusCode || 500).format({
            'application/json': () => {
                res.json({error: err.message || ( err.data  && err.data.error && err.data.error.description ), errors })
            },
            default() {
                res.send('Internal Server Error')
            },
        })
    });



/*    app.get('/ping', asyncMiddleware (async (req, res) => {
        res.send('pong')
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    }));*/

    app.get('/token', asyncMiddleware (async (req, res) => {
        try{
            const jwtClient = new google.auth.JWT(
                key.client_email,
                null,
                key.private_key,
                ['https://www.googleapis.com/auth/drive.readonly'],
                null
            );
            jwtClient.authorize((err, tokens) => {
                if (err) {
                    console.error("Error making request to generate access token:", err);
                } else if (tokens.access_token === null) {
                    console.error("Provided service account does not have permission to generate access tokens");
                } else {
                    accessToken = tokens.access_token;
                    res.send(accessToken);
                    //console.log(`access ${accessToken}`)

                }
            });
        }catch (e){
            console.log(e)
        }


    }))
    app.get('/files', asyncMiddleware (async (req, res) => {
        try {
            const result = [];

            const gDrive = driveInit();

            const response  = await gDrive.files.list({
                q: `'${FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                fields: 'files(id, name)',
            });

            const subfolders = response.data.files;

            await Promise.all( subfolders.map( async subFolder => {
                result.push({ name: subFolder.name ,totalSize: 0, files: [] })
                await getFolder(subFolder.id, result[result.length - 1])
            }))


            res.json(result);
        }catch (e){
            console.log(e)
        }

    }))
    app.get('/patcher', asyncMiddleware (async (req, res) => {

        const response = await driveInit().files.list({
            q: `'${FOLDER_PATCHER}' in parents and trashed=false`,
            fields: 'files(id, name, mimeType, size, md5Checksum)',
        });

        const result =  response.data.files.map( file => {
            return { name: file.name, id: file.id, size: file.size ,md5Checksum: file.md5Checksum, version: version }
        })

        res.json(result);

    }))

   /* app.get("/files/:fileId", (req, res) => {

        return driveInit().files.get(
            { fileId:req.params.fileId, alt: 'media' },
            { responseType: 'stream' }
        )
            .then((response) => {

                res.setHeader('Content-disposition', contentDisposition(response.headers['content-disposition']));

                response.data.pipe(res);
            });

    })
*/


    app.get('/auth', asyncMiddleware (async (req, res) => {

        const query = req.query;
        const authCode = query.code; // The authorization code from the request query
        // The Discord member ID from the state parameter

        if(authCode){
            try {
                const guildState = JSON.parse(atob(query.state)).id;
                const userId = JSON.parse(atob(query.state)).userId;
                const userName = JSON.parse(atob(query.state)).userName;
                const uuid = JSON.parse(atob(query.state)).uuid;

                //console.log(guildState)
                const guild = await Guilds.findOne({id: guildState});
                if(guild){
                    if(guild.authLinks.includes(uuid)) {
                        return res.status(400).send('Session expired, please create a new one')
                    }
                }


                //console.log(guild)
                //console.log(userId)
                //console.log(userName)


                async function getAccessToken(clientId, clientSecret) {
                    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

                    const response = await axios.post(`https://us.battle.net/oauth/token`,
                        'grant_type=client_credentials',
                    {
                        headers: {
                            'Authorization': `Basic ${auth}`,
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    });

                    if (response.status === 200) {
                        return await response.data.access_token;
                    } else {
                        throw new Error(`Error: ${response.status}`);
                    }
                }



                const apiToken = await getAccessToken(bnetId, bnetSecret)
                console.log(apiToken)

                const tokenResponse = await axios.post('https://eu.battle.net/oauth/token',
                    new URLSearchParams({
                        client_id: bnetId,
                        client_secret: bnetSecret,
                        redirect_uri: `${redirectUrl}/auth`,
                        code: authCode,
                        grant_type: 'authorization_code'
                    }).toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });
                const tokenData = tokenResponse.data;
                //console.log(tokenData)

                // Use the access token to get the user's BattleTag
                let userData = await axios.get('https://us.battle.net/oauth/userinfo', {
                    headers: {
                        'Authorization': `Bearer ${tokenData.access_token}`
                    }
                })
                userData = await userData.data

                //console.log(userData)
                //console.log(userData.id)
                //console.log(apiToken)




                void authUser(userData.battletag, userData.id, userId, userName, apiToken ,client, guildState);
                //console.log(`BattleTag: ${userData.battletag}, battleId: ${userData.id}, Discord Name: ${userName}  ,Discord Member ID: ${userId}`);

                return (res.redirect(`${discordUrl}`)); // Redirect to your server / Hardcoded link to one exact server
            }
            catch (err) {
                console.error(err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

        }
    }));
    app.listen(port, () => console.log(`App listening at ${redirectUrl}`));
}

module.exports = init;