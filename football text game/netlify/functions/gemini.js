// netlify/functions/gemini.js
exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { prompt } = JSON.parse(event.body);
        const apiKey = process.env.GEMINI_API_KEY;

        // 防御 1：检查有没有配置秘钥
        if (!apiKey) {
            console.error("严重错误：Netlify 环境变量中找不到 GEMINI_API_KEY");
            return { statusCode: 500, body: JSON.stringify({ error: '服务器丢失了 API 钥匙！' }) };
        }

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        
        // 防御 2：如果 Google 返回了错误信息，把真正的错误打印到黑屏日志里！
        if (!data.candidates || data.candidates.length === 0) {
            console.error("❌ Google API 拒绝了请求，它的真实回复是:", JSON.stringify(data));
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'API 钥匙失效或请求被拒，请查看 Netlify 后台日志。' })
            };
        }

        const replyText = data.candidates[0].content.parts[0].text;

        return {
            statusCode: 200,
            body: JSON.stringify({ message: replyText })
        };

    } catch (error) {
        console.error("API 调用遭遇系统级崩溃:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'AI 解说员彻底断线了...' })
        };
    }
};
