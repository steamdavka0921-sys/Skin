const axios = require('axios');

exports.handler = async (event) => {
    const { queryStringParameters } = event;
    const protocol = event.headers['x-forwarded-proto'] || 'http';
    const host = event.headers.host;
    const RETURN_URL = `${protocol}://${host}/.netlify/functions/steam-login`;
    const API_KEY = process.env.STEAM_API_KEY;

    // 1. Стим рүү илгээх (OpenID Setup)
    if (!queryStringParameters['openid.mode']) {
        const steamLoginUrl = 'https://steamcommunity.com/openid/login' +
            '?openid.ns=http://specs.openid.net/auth/2.0' +
            '&openid.mode=checkid_setup' +
            `&openid.return_to=${encodeURIComponent(RETURN_URL)}` +
            `&openid.realm=${protocol}://${host}/` +
            '&openid.identity=http://specs.openid.net/auth/2.0/identifier_select' +
            '&openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select';
        
        return {
            statusCode: 302,
            headers: { Location: steamLoginUrl }
        };
    }

    // 2. Стимээс буцаж ирэх үед (OpenID Response)
    if (queryStringParameters['openid.mode'] === 'id_res') {
        const steamId = queryStringParameters['openid.claimed_id'].split('/').pop();

        try {
            // Steam API-аас хэрэглэгчийн нэр, зургийг татах
            const userRes = await axios.get(
                `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${API_KEY}&steamids=${steamId}`
            );
            
            const player = userRes.data.response.players[0];
            
            // Датаг URL-аар дамжуулж үндсэн сайт руу буцаах
            const redirectUrl = `${protocol}://${host}/?` + new URLSearchParams({
                steamid: steamId,
                name: player.personaname,
                avatar: player.avatarfull
            }).toString();

            return {
                statusCode: 302,
                headers: { Location: redirectUrl }
            };
        } catch (error) {
            // Алдаа гарвал зөвхөн SteamID-тай буцаах
            console.error("Steam Profile Error:", error);
            return {
                statusCode: 302,
                headers: { Location: `${protocol}://${host}/?steamid=${steamId}` }
            };
        }
    }

    return {
        statusCode: 400,
        body: 'Invalid OpenID Request'
    };
};
