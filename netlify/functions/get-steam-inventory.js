const axios = require('axios');

exports.handler = async (event) => {
    const steamId = event.queryStringParameters.steamid;
    
    // Header setup for CORS
    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET"
    };

    if (!steamId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "SteamID is required" }) };
    }

    try {
        // Steam Inventory API - CS2 AppID: 730, ContextID: 2
        const response = await axios.get(
            `https://steamcommunity.com/inventory/${steamId}/730/2?l=english&count=5000`
        );

        if (!response.data || !response.data.assets || !response.data.descriptions) {
            return { statusCode: 200, headers, body: JSON.stringify({ items: [] }) };
        }

        const assets = response.data.assets;
        const descriptions = response.data.descriptions;

        // Зөвхөн зарах боломжтой (tradable) скинүүдийг шүүх
        const items = assets.map(asset => {
            const desc = descriptions.find(d => d.classid === asset.classid && d.instanceid === asset.instanceid);
            
            if (desc && desc.tradable === 1) {
                return {
                    assetid: asset.assetid,
                    name: desc.market_hash_name,
                    // Steam-ийн CDN-ээс зургийн URL-г бүтнээр нь угсрах
                    image: `https://community.cloudflare.steamstatic.com/public/images/econ/characters/${desc.icon_url}`,
                    rarity: desc.tags.find(t => t.category === "Rarity")?.name || "Normal"
                };
            }
            return null;
        }).filter(item => item !== null);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ items })
        };

    } catch (error) {
        console.error("Inventory Fetch Error:", error.message);
        
        // Стим инвентор хаалттай (Private) үед гардаг алдааг барих
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: "Could not fetch inventory. Ensure your Steam Profile & Inventory are set to PUBLIC.",
                details: error.message 
            })
        };
    }
};
