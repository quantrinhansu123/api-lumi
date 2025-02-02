import { getGoodMorningGroq } from "../services/groq.services.js";
export const goodMorningController = async (req, res) => {
    const { appName } = req.query
    res.status(200).json({ message: await getGoodMorningGroq(appName) });
}

