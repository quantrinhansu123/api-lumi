import express from "express";
import aiRoute from "./groq.route.js";
import svgRoute from "./svg.route.js";
import qrRoute from "./qr.router.js";
import sheetRoute from "./sheet.route.js";
let router = express.Router();
let initWebRoutes = (app, io) => {
    router.use(`/groq`, aiRoute)
    router.use(`/svg`, svgRoute)
    router.use(`/qr`, qrRoute)
    router.use(`/sheet`, sheetRoute)
    return app.use('/', router);
}

export default initWebRoutes;
