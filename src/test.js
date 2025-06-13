// Import các thư viện cần thiết sử dụng cú pháp import
import { onRequest } from 'firebase-functions/v2/https'; // Sử dụng Cloud Functions v2 HTTP trigger
import { initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// Khởi tạo Firebase Admin SDK.
// Trong môi trường Cloud Functions, Admin SDK thường tự khởi tạo.
// Nếu bạn chạy local hoặc trong môi trường khác, có thể cần gọi initializeApp()
initializeApp(); // Tự động lấy cấu hình từ môi trường Cloud Functions

// Tạo một hàm Cloud Function sử dụng cú pháp export
export const sendNotification = onRequest(async (req, res) => {
  // Đặt tiêu đề cho response CORS (quan trọng cho các yêu cầu từ trình duyệt web)
  res.set('Access-Control-Allow-Origin', '*'); // Cho phép từ bất kỳ origin nào

  // Xử lý preflight request cho CORS (OPTIONS method)
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }

  // Lấy FCM token và dữ liệu thông báo từ body của request
  const registrationToken = "f8o6BAz_SMedz3ozWGEYwN:APA91bFVJDbHMj2afVFF0QmE8LP5NBmbaynTm3arJRAl__ewQqwnS_0eEhwugHF-rPQB3SoccR0Ic2UnEj1WjNnmGtT_rfG7EVLBm1ck18rbsfrSp1w_dp4";
  const notificationTitle = req.body.title || 'Notification Title'; // Tiêu đề mặc định
  const notificationBody = req.body.body || 'Notification body text.'; // Nội dung mặc định

  // Kiểm tra xem có token hay không
  if (!registrationToken) {
    res.status(400).send('Missing registration token.');
    return;
  }

  // Xây dựng nội dung tin nhắn
  const message = {
    notification: {
      title: notificationTitle,
      body: notificationBody,
    },
    token: registrationToken,
    // Bạn có thể thêm data payload tùy chỉnh ở đây nếu cần
    // data: {
    //   key1: 'value1',
    //   key2: 'value2'
    // }
  };

  try {
    // Gửi tin nhắn bằng Admin SDK Messaging
    const response = await getMessaging().send(message);
    console.log('Successfully sent message:', response);
    res.status(200).json({ message: 'Notification sent successfully!', response: response });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending notification.', error: error.message });
  }
});
