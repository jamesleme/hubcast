import { kv } from '@vercel/kv';

const CACHE_EXPIRATION_SECONDS = 10 * 60; // 10 minutos

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
            // Se a chave não estiver configurada, é um erro de servidor real
            return res.status(500).json({ error: 'API Key não configurada no servidor.' });
        }
        
        const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&eventType=${eventType}&order=date&maxResults=5&key=${YOUTUBE_API_KEY}`;
        
        const response = await fetch(apiUrl);

        // =========================================================
        // LÓGICA DE ERRO MELHORADA
        // =========================================================
        if (!response.ok) {
            // Se for um erro de cota (403) ou similar, não é um erro do nosso servidor.
            // Apenas logamos e retornamos um JSON de erro que o frontend pode ignorar.
            console.error(`Recebido status ${response.status} da API do YouTube. Provavelmente cota excedida.`);
            const errorData = await response.json(); // Tenta ler o corpo do erro do YouTube
            return res.status(response.status).json(errorData);
        }

        const data = await response.json();

        // Salva apenas respostas bem-sucedidas no cache
        await kv.set(cacheKey, data, { ex: CACHE_EXPIRATION_SECONDS });

        return res.status(200).json(data);

    } catch (error) {
        // Este catch agora pega apenas erros inesperados (ex: falha de rede)
        console.error("Erro inesperado no backend:", error);
        return res.status(502).json({ error: 'Falha ao se comunicar com a API do YouTube.' });
    }
}