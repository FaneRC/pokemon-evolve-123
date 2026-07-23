import { Router } from "express";

import { getRecommendation, searchPokemon } from "../controllers/recommendationsController.js";

const recommendationsRouter = Router();

recommendationsRouter.get("/pokemon/search", searchPokemon);
recommendationsRouter.post("/recommendations", getRecommendation);

export default recommendationsRouter;