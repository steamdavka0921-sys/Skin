const axios = require('axios');

exports.handler = async (event) => {
    const { queryStringParameters } = event;
    // Таны домэйн нэр Netlify дээр бэлэн болохоор автоматаар энд орно
    const protocol = event.headers['x-forwarded-proto'] || 'http';
    const host = event.headers.host;
    const RETURN_URL = `${protocol}://${host}/.netlify/functions/steam-login`;

    // 1. Steam рүү Redirect хийх хэсэг
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

    // 2. Steam-ээс буцаж ирэх үеийн баталгаажуулалт
    if (queryStringParameters['openid.mode'] === 'id_res') {
        const claimedId = queryStringParameters['openid.claimed_id'];
        const steamId = claimedId.split('/').pop(); 

        // Амжилттай бол үндсэн хуудас руу steamid-тай нь буцаана
        return {
            statusCode: 302,
            headers: { Location: `/?steamid=${steamId}` }
        };
    }

    return { statusCode: 400, body: 'Steam Authentication Failed' };
};
