export const progressCircle = async (percent) => {
    let percent = parseInt(percent, 10) || 0;
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
    return svg
}