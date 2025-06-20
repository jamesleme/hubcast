// A função onRequestGet é executada quando alguém acessa /functions/get-youtube-data
export async function onRequestGet(context) {
    try {
        // Pega a URL completa da requisição que o frontend fez
        const url = new URL(context.request.url);

        // Pega os parâmetros da URL, como 'channelId' e 'eventType'
        const channelId = url.searchParams.get('channelId');
        const eventType = url.searchParams.get('eventType');

        // Pega a chave de API da variável de ambiente segura que vamos configurar no Cloudflare
        const YOUTUBE_API_KEY = context.env.YOUTUBE_API_KEY;

        if (!YOUTUBE_API_KEY) {
            return new Response('API Key not configured', { status: 500 });
        }

        // Monta a URL da API do YouTube
        const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&eventType=${eventType}&order=date&maxResults=5&key=${YOUTUBE_API_KEY}`;

        // Faz a chamada real para o YouTube a partir do servidor da Cloudflare
        const response = await fetch(apiUrl);
        const data = await response.json();

        // Retorna os dados como JSON para o seu frontend
        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        return new Response('Error fetching data: ' + error.message, { status: 500 });
    }
}