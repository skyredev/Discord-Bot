const { request } = require('undici');
const express = require('express');
const { clientId, clientSecret, port, redirectUrl, discordUrl } = require('./tokens.json');
const {verifyUser} = require('./Services/dataBaseServices');
const {getUser} = require("./Services/dataBaseServices");
const { google } = require('googleapis');
const contentDisposition  = require('content-disposition');
const path = require("path");


const keyFile = path.join(__dirname, 'service.json');
const key = require(keyFile);
let accessToken = null;
const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});


const FOLDER_ID = '120ZQ98GRY-gnrC7bz8YdmKWLIvNZkuXt';
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
    app.get('/ping', (req, res) => {
        res.send('pong')
    })

    app.get('/token', (req, res) => {
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

    })
    app.get('/files', async (req, res) => {

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
    })

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
                return (response.send(error.stack))
            }
        }

        return (response.redirect(`${discordUrl}`)); // Redirect to your server / Hardcoded link to one exact server
    });
    app.listen(port, () => console.log(`App listening at ${redirectUrl}`));
}

module.exports = init;