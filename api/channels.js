import { kv } from '@vercel/kv';

const CACHE_EXPIRATION_SECONDS = 60 * 60; // Cache de 1 hora para logos, pois mudam menos

export default async function handler(req, res) {
    try {
        const { ids } = req.query;
        if (!ids) return res.status(400).json({ error: 'Nenhum ID de canal foi fornecido.' });

        const cacheKey = `channels:${ids}`;
        let cachedData = await kv.get(cacheKey);

        if (cachedData) {
            console.log(`Cache HIT para a chave de canais: ${cacheKey}`);
            return res.status(200).json(cachedData);
        }

        console.log(`Cache MISS para a chave de canais: ${cacheKey}. Buscando na API...`);
        
        const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
        if (!YOUTUBE_API_KEY) throw new Error('API Key não configurada');
        
        const apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${ids}&key=${YOUTUBE_API_KEY}`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`Erro da API do YouTube: ${response.statusText}`);

        const data = await response.json();

        await kv.set(cacheKey, data, { ex: CACHE_EXPIRATION_SECONDS });

        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: 'Falha ao buscar dados do canal: ' + error.message });
    }
}