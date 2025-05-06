import axios from "axios";
import { generateQR } from "../services/qr.service.js";

export const getQR = async (req, res) => {
    try {
        const { orderId, amount } = req.query;

        const acc = await axios.post(`https://www.appsheet.com/api/v2/apps/18f892a1-82e5-4731-a85a-8cad999d11f2/tables/Đơn mua booking/Action`, {
            "Action": "Find",
            "Properties": {
                "Usersettings": {
                    "info": "Admin"
                }
            },
            "Rows": [
                {
                    "Id": orderId,
                }
            ]
        }, {
            headers: {
                "ApplicationAccessKey": `${process.env.APPSHEET_KEY}`,
                "Content-Type": `application/json`,
            }
        })
        

        if (!acc?.data[0]["qrText"]) {

            const data = await axios.post(`https://core.devops.sieutho.vn/external/deposit`,
                {

                    "OrderId": orderId,

                    "Amount": amount

                }, {
                headers: {
                    "api-key": process.env.QR_KEY,
                    "Content-Type": `application/json`,
                }
            }
            )


            const svg = await generateQR(data?.data?.data);

            res.setHeader('Content-Type', 'image/svg+xml');
            res.send(svg);

            setTimeout(async () => {
                await axios.post(`https://www.appsheet.com/api/v2/apps/18f892a1-82e5-4731-a85a-8cad999d11f2/tables/Đơn mua booking/Action`, {
                    "Action": "Edit",
                    "Properties": {
                        "Usersettings": {
                            "info": "Admin"
                        }
                    },
                    "Rows": [
                        {
                            "Id": orderId,
                            "qrText": `https://n-api-rouge.vercel.app/qr/text?text=${data?.data?.data}`,
                            "QR Thanh toán":" "
                        }
                    ]
                }, {
                    headers: {
                        "ApplicationAccessKey": `${process.env.APPSHEET_KEY}`,
                        "Content-Type": `application/json`,
                    }
                })
            }, 6000);
        } else {
            return
        }
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
