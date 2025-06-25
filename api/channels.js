export default async function handler(req, res) {
    try {
        // Pega a lista de IDs de canais da URL (ex: ?ids=ID1,ID2,ID3)
        const { ids } = req.query;

        if (!ids) {
            return res.status(400).json({ error: 'Nenhum ID de canal foi fornecido.' });
        }

        const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

        if (!YOUTUBE_API_KEY) {
            return res.status(500).json({ error: 'API Key not configured on the server.' });
        }
        
        // Usamos o endpoint "channels" da API, que é mais eficiente para buscar dados de canais.
        // Ele aceita múltiplos IDs separados por vírgula.
        const apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${ids}&key=${YOUTUBE_API_KEY}`;
        
        const response = await fetch(apiUrl);
        const data = await response.json();

        // Adiciona um header de cache para o navegador não guardar resultados antigos
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate'); // Cache de 1 hora

        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch channel data: ' + error.message });
    }
}