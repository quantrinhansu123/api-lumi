import { getGoodMorningGroq } from "../services/groq.services.js";
import { Client } from 'pg';

export const goodMorningController = async (req, res) => {
    const { appName } = req.query
    res.status(200).json({ message: await getGoodMorningGroq(appName) });
}



// Hàm để kết nối và đọc dữ liệu từ PostgreSQL
const getDataFromPostgres = async (config, table, query) => {
    const client = new Client(config);
    const safeQuery = query ? `WHERE ${query}` : ''; // Nếu không có query thì lấy tất cả
    const sqlQuery = `SELECT * FROM "${table}" ${safeQuery}`;

    try {
        await client.connect();
        const res = await client.query(sqlQuery);  // Thực hiện truy vấn SQL
        return res.rows;  // Trả về mảng dữ liệu
    } catch (err) {
        console.error('Lỗi:', err.stack);
        throw err;  // Ném lỗi nếu có
    } finally {
        await client.end();
    }
};


// Controller để xử lý yêu cầu
export const queryController = async (req, res) => {
    const { table, query } = req.body;  // Nhận dữ liệu từ body (table và query)

    // Cấu hình kết nối PostgreSQL
    const config = {
        host: process.env.HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: {
            rejectUnauthorized: false, // Đảm bảo chứng chỉ là hợp lệ (nếu bạn có chứng chỉ)
          },
    };

    try {
        // Kiểm tra nếu không có table
        if (!table) {
            return res.status(400).json({ error: 'Thiếu table trong yêu cầu.' });
        }

        // Gọi hàm getDataFromPostgres để truy vấn dữ liệu
        const data = await getDataFromPostgres(config, table, query);

        // Trả về kết quả
        return res.status(200).json(data);
    } catch (err) {
        console.error('Lỗi truy vấn:', err);
        return res.status(500).json({ error: 'Có lỗi xảy ra khi truy vấn dữ liệu.' });
    }
};