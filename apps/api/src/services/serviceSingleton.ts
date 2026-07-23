import { loadPokemon } from "./csvLoader.js";
import { RecommendationService } from "./recommendationService.js";

export const recommendationService = new RecommendationService(loadPokemon());
