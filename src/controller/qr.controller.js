import axios from "axios";
import { generateQR } from "../services/qr.service.js";

export const getQR = async (req, res) => {
    try {
        const { orderId, amount } = req.query;

        // Gửi request tạo mã QR
        const { data } = await axios.post(`https://core.devops.sieutho.vn/external/deposit`,
            {
                OrderId: orderId,
                Amount: amount
            },
            {
                headers: {
                    "api-key": process.env.QR_KEY,
                    "Content-Type": "application/json",
                }
            }
        );

        const qrText = data?.data?.data;

        // Thực hiện song song:
        const [_, svg] = await Promise.all([
            // Gửi request cập nhật vào AppSheet
            axios.post(`https://www.appsheet.com/api/v2/apps/18f892a1-82e5-4731-a85a-8cad999d11f2/tables/${app.table}/Action`, {
                Action: "Edit",
                Properties: {},
                Rows: [
                    {
                        Id: orderId,
                        qrText: qrText,
                    }
                ]
            }, {
                headers: {
                    "ApplicationAccessKey": process.env.APPSHEET_KEY,
                    "Content-Type": "application/json",
                }
            }),

            // Tạo SVG QR code
            generateQR(qrText)
        ]);

        res.setHeader('Content-Type', 'image/svg+xml');
        res.send(svg);

    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi tạo QR');
    }
};


export const getQRText = async (req, res) => {
    try {
        const { text } = req.query;

        const svg = await generateQR(text);

        res.setHeader('Content-Type', 'image/svg+xml');
        res.send(svg);
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi tạo QR');
    }
};
