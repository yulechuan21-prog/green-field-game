exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { message } = JSON.parse(event.body);
        const apiKey = process.env.GEMINI_API_KEY; 

        if (!apiKey) {
            console.error("缺失 API Key！请检查 Netlify 环境变量。");
            return { statusCode: 500, body: JSON.stringify({ reply: "《系统警告：未检测到阿卡夏密钥 (API Key)》" }) };
        }

        const systemPrompt = `你现在是《全域进化论：阿卡夏之光》系统的“世界之声”。
        玩家将输入指令，你需要根据设定书的逻辑，判定其行为结果、受苦抗性增加，或推进文字剧情。
        请保持冷酷、神秘，并包含一定的硬核数值反馈或系统吐槽。`;

        // 纠正 1：使用稳定版本的模型 gemini-1.5-flash
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                // 纠正 2：严格使用驼峰命名 systemInstruction
                systemInstruction: {
                    parts: [{ text: systemPrompt }]
                },
                contents: [
                    { role: "user", parts: [{ text: message }] }
                ]
            })
        });

        const data = await response.json();
        
        // 增加深度排查：如果 Google 依然报错，把完整错误打印到 Netlify 后台
        if (!response.ok) {
            console.error("Google API 详细报错:", JSON.stringify(data, null, 2));
            return { 
                statusCode: 400, 
                body: JSON.stringify({ reply: `《世界之声解析失败：${data.error?.message || "未知格式错误"}》` }) 
            };
        }

        const reply = data.candidates[0].content.parts[0].text;

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reply: reply })
        };

    } catch (error) {
        console.error("后端执行崩溃:", error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ reply: "《世界之声遭到深渊物理干扰，通信彻底中断》" }) 
        };
    }
};
