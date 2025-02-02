import { getGoodMorningGroq } from "../services/groq.services.js";
export const goodMorningController = async (req, res) => {
  res.status(200).json({ message: await getGoodMorningGroq() });
}

