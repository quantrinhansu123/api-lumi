export const progressCircle = async (req, res) => {
    let percent = parseInt(req.query.percent, 10) || 0;
    percent = Math.max(1, Math.min(100, percent)); // Giới hạn từ 1 - 100

    const size = 120;
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - percent / 100);

    const svg = `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
            <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" stroke="#ddd" stroke-width="${strokeWidth}" fill="none" />
            <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" stroke="#BC2967" stroke-width="${strokeWidth}" fill="none"
                stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round"
                transform="rotate(-90 ${size / 2} ${size / 2})"
            />
            <text x="50%" y="50%" text-anchor="middle" dy="6px" font-size="20px" fill="#BC2967">${percent}%</text>
        </svg>
    `;
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
}

export const progressBar = async (req, res) => {
    const percent = Math.max(0, Math.min(100, parseInt(req.query.percent, 10) || 0)); // Giới hạn từ 0 - 100
    const width = parseInt(req.query.width, 10) || 200;
    const height = parseInt(req.query.height, 10) || 20;
    const bgColor = req.query.bgColor ? decodeURIComponent(req.query.bgColor) : "#ddd";
    const progressColor = req.query.progressColor ? decodeURIComponent(req.query.progressColor) : "#BC2967";

    // Tính chiều rộng thanh progress
    const barWidth = (percent / 100) * width;

    // Tạo SVG
    const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="${width}" height="${height}" fill="${bgColor}" rx="5" />
            <rect width="${barWidth}" height="${height}" fill="${progressColor}" rx="5" />
            <text x="${width / 2}" y="${height / 2}" text-anchor="middle" font-size="12" fill="#fff" dominant-baseline="middle">
                ${percent}%
            </text>
        </svg>
    `;

    // Gửi phản hồi dưới dạng SVG
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(svg);
};
