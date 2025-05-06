import QRCode from 'qrcode'

export const generateQR = async (text) => {
    if (!text) return '';

    try {
        const svg = await QRCode.toString(text, {
            type: 'svg',
            color: {
                dark: '#000000',  // Màu QR
                light: '#FFFFFF'  // Nền
            },
            margin: 2,
            width: 200
        });

        return svg;
    } catch (err) {
        console.error('QR Generation Error:', err);
        return '';
    }
};
