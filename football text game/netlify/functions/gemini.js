// netlify/functions/gemini.js
exports.handler = async function(event, context) {
    // 1. 拦截非法请求（只允许 POST 请求）
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // 2. 获取前端传来的游戏指令（比如：“玩家选择了强行突破”）
        const { prompt } = JSON.parse(event.body);

        // 3. 从 Netlify 的安全金库中读取你的 API Key！(绝对不写死在代码里)
        const apiKey = process.env.GEMINI_API_KEY;

        // 4. 向 Gemini 发送正式的 API 请求 (这里以 gemini-1.5-flash 为例)
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        
        // 提取生成的文字内容
        const replyText = data.candidates[0].content.parts[0].text;

        // 5. 将生成的解说词安全地返回给前端
        return {
            statusCode: 200,
            body: JSON.stringify({ message: replyText })
        };

    } catch (error) {
        console.error("API 调用失败:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'AI 解说员暂时失去了连接...' })
        };
    }
};
