import express from "express";
import sheetRoute from "./sheet.route.js";
let router = express.Router();
let initWebRoutes = (app, io) => {
    router.use(`/sheet`, sheetRoute)
    return app.use('/', router);
}

export default initWebRoutes;
