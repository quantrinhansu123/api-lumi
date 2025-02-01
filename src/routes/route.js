import express from "express";
import aiRoute from "./groq.route.js";
let router = express.Router();
let initWebRoutes = (app, io) => {
    router.use(`/groq`, aiRoute)
    return app.use('/', router);
}

export default initWebRoutes;
