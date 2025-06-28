import { kv } from '@vercel/kv';

// Tempo de validade do cache em segundos (ex: 10 minutos)
const CACHE_EXPIRATION_SECONDS = 10 * 60; 

export default async function handler(req, res) {
    try {
        const { channelId, eventType } = req.query;

        // Cria uma chave única para o cache baseada no pedido
        const cacheKey = `youtube:${eventType}:${channelId}`;

        // 1. TENTA LER DO CACHE
        let cachedData = await kv.get(cacheKey);

        if (cachedData) {
            // Cache HIT: Retorna os dados salvos imediatamente
            console.log(`Cache HIT para a chave: ${cacheKey}`);
            return res.status(200).json(cachedData);
        }

        // 2. CACHE MISS: Se não houver dados no cache, busca na API
        console.log(`Cache MISS para a chave: ${cacheKey}. Buscando na API...`);
        
        const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
        if (!YOUTUBE_API_KEY) throw new Error('API Key não configurada');
        
        const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&eventType=${eventType}&order=date&maxResults=5&key=${YOUTUBE_API_KEY}`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`Erro da API do YouTube: ${response.statusText}`);

        const data = await response.json();

        // 3. SALVA OS NOVOS DADOS NO CACHE
        // O 'ex' define o tempo de expiração em segundos.
        await kv.set(cacheKey, data, { ex: CACHE_EXPIRATION_SECONDS });

        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: 'Falha ao buscar dados: ' + error.message });
    }
}