// Em: api/youtube.js - Versão para Vercel

// A Vercel usa o formato de export default para as funções
export default async function handler(req, res) {
    try {
        // Pega os parâmetros da URL, como 'channelId' e 'eventType'
        const { channelId, eventType } = req.query;

        // Pega a chave de API da variável de ambiente segura configurada no painel da Vercel
        const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

        if (!YOUTUBE_API_KEY) {
            return res.status(500).json({ error: 'API Key not configured' });
        }
        
        const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&eventType=${eventType}&order=date&maxResults=5&key=${YOUTUBE_API_KEY}`;
        
        const response = await fetch(apiUrl);

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ error: `Error from YouTube API: ${errorText}` });
        }

        const data = await response.json();

        // Envia os dados de volta como JSON para o seu frontend
        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch data: ' + error.message });
    }
}