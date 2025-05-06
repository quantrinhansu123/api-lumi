import axios from "axios";
import { generateQR } from "../services/qr.service.js";

export const getQR = async (req, res) => {
    try {
        const { orderId, amount } = req.query;

        const data = await axios.post(`https://core.devops.sieutho.vn/external/deposit`,
            {

                "OrderId": orderId,

                "Amount": amount

            }, {
            headers: {
                "api-key": `aa8dc828-a4be-41a2-be77-8d228fd494a2`,
                "Content-Type": `application/json`,
            }
        }
        )
        if (!text) {
            return res.status(400).send('Thiếu tham số "text"');
        }

        const svg = await generateQR(data?.data?.data);

        res.setHeader('Content-Type', 'image/svg+xml');
        res.send(svg);
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi tạo QR');
    }
};
