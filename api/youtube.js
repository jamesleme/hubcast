import { kv } from '@vercel/kv';

const CACHE_EXPIRATION_SECONDS = 10 * 60; // 10 minutos
const API_TIMEOUT_MS = 8000; // Timeout de 8 segundos para a chamada ao YouTube

export default async function handler(req, res) {
    try {
        const { channelId, eventType } = req.query;
        const cacheKey = `youtube:${eventType}:${channelId}`;

        // 1. Tenta ler do cache
        let cachedData = await kv.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(cachedData);
        }

        // 2. Cache miss, busca na API
        const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
        if (!YOUTUBE_API_KEY) {
            return res.status(500).json({ error: 'API Key não configurada no servidor.' });
        }
        
        const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&eventType=${eventType}&order=date&maxResults=5&key=${YOUTUBE_API_KEY}`;
        
        // =========================================================
        // LÓGICA DE FETCH COM TIMEOUT MANUAL
        // =========================================================
        const fetchPromise = fetch(apiUrl);
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('API timeout')), API_TIMEOUT_MS)
        );

        // A Promise.race resolve com o que terminar primeiro: o fetch ou o timeout
        const response = await Promise.race([fetchPromise, timeoutPromise]);

        if (!response.ok) {
            console.error(`Recebido status ${response.status} da API do YouTube.`);
            const errorData = await response.json();
            return res.status(response.status).json(errorData);
        }

        const data = await response.json();
        await kv.set(cacheKey, data, { ex: CACHE_EXPIRATION_SECONDS });

        return res.status(200).json(data);

    } catch (error) {
        // Agora, este catch pegará tanto o erro de timeout quanto outros erros
        console.error("Erro no backend:", error.message);
        // Retorna um 504 Gateway Timeout se o nosso timeout manual for acionado
        if (error.message === 'API timeout') {
            return res.status(504).json({ error: 'A API do YouTube demorou muito para responder.' });
        }
        return res.status(502).json({ error: 'Falha ao se comunicar com a API do YouTube.' });
    }
}