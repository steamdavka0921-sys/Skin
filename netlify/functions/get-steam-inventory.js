const axios = require('axios');

exports.handler = async (event) => {
    const steamId = event.queryStringParameters.steamid;
    // Netlify Dashboard -> Site Settings -> Environment Variables-д STEAM_API_KEY-г хийхээ мартуузай
    const API_KEY = process.env.STEAM_API_KEY; 

    if (!steamId) {
        return { 
            statusCode: 400, 
            body: JSON.stringify({ error: "SteamID is required" }) 
        };
    }

    try {
        // Steam Community Inventory API
        const response = await axios.get(`https://steamcommunity.com/inventory/${steamId}/730/2?l=english&count=500`);
        
        if (!response.data || !response.data.descriptions) {
            return {
                statusCode: 200,
                body: JSON.stringify({ items: [], message: "Inventory is empty or private" })
            };
        }

        const items = response.data.descriptions.map(desc => {
            return {
                assetid: desc.classid,
                name: desc.market_hash_name,
                image: `https://community.cloudflare.steamstatic.com/public/images/econ/characters/${desc.icon_url}`,
                tradable: desc.tradable
            };
        }).filter(item => item.tradable === 1); 

        return {
            statusCode: 200,
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*" 
            },
            body: JSON.stringify({ items })
        };
    } catch (error) {
        console.error("Steam API Error:", error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Inventory is private or Steam API is down" })
        };
    }
};
