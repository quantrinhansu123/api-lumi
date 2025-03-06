import express from "express";
import aiRoute from "./groq.route.js";
import svgRoute from "./svg.route.js";
let router = express.Router();
let initWebRoutes = (app, io) => {
    router.use(`/groq`, aiRoute)
    router.use(`/svg`, svgRoute)
    return app.use('/', router);
}

export default initWebRoutes;
