import Groq from "groq-sdk";
import 'dotenv/config';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function getGroqChatCompletion() {
  return groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: "Explain the importance of fast language models",
      },
    ],
    model: "llama-3.3-70b-versatile",
  });
}

export async function getGoodMorningGroq(appName) {
  if (appName) {
    const vietnamTimezone = new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const todayFormatted = vietnamTimezone.format(new Date());

    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Hôm nay là ${todayFormatted} theo lịch Việt Nam.
          
          🎯 Yêu cầu:
          - Nếu là ngày lễ: Title phải sinh động, có emoji, phản ánh tinh thần ngày lễ, khích lệ làm việc hiệu quả.
          - Nếu là ngày thường: Title phải hào hứng, đa dạng, không lặp lại công thức cũ, khích lệ làm việc hiệu quả.
           - **Tên ${appName} phải xuất hiện một cách tự nhiên trong title hoặc message.**
          - **Luôn sử dụng tiếng Việt chuẩn**, không có từ ngữ lộn xộn, không sai chính tả.
        - **Thêm emoji phù hợp**, nhưng không quá nhiều.
          - **Message** phải ngắn gọn, động viên tích cực, có emoji nhưng không quá nhiều.
          - **Chỉ trả về JSON**, không được có văn bản thừa.
  
          📌 Format JSON chính xác:
          \`\`\`json
          {
            "title": "Tiêu đề ngắn gọn",
            "message": "Nội dung truyền cảm hứng"
          }
          \`\`\`
          
          Ví dụ nếu là thứ Hai bình thường:
          \`\`\`json
          {
            "title": "🔥 Bùng nổ tuần mới nào!",
            "message": "Cơ hội mới đang chờ bạn, hãy chiến hết mình! 🚀✨"
          }
          \`\`\`
  
          Nếu là ngày lễ như 30/4:
          \`\`\`json
          {
            "title": "🎉 Chào mừng ngày Giải phóng miền Nam!",
            "message": "Hôm nay là ngày để tưởng nhớ và tiếp tục vươn xa! 🇻🇳✨"
          }
          \`\`\`
          `,
        },
      ],
      model: "mixtral-8x7b-32768",
      temperature: 0.7,
    });

    // 🔍 Tìm và lấy JSON từ kết quả AI trả về
    const jsonMatch = response.choices[0]?.message?.content?.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]); // Chuyển về object JSON
      } catch (error) {
        console.error("❌ Lỗi parse JSON:", error);
        return null;
      }
    } else {
      console.warn("⚠️ AI trả về nội dung không đúng format.");
      return null;
    }
  }
}
