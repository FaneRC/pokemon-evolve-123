import type {
	PokemonLite,
	RecommendationMode,
	RecommendationResult,
	Role
} from "../types/recommendation";
import { localRecommend, localSearchPokemon } from "./localRecommendation";

export const searchPokemon = async (query: string, signal?: AbortSignal): Promise<PokemonLite[]> => {
	if (signal?.aborted) {
		return [];
	}
	const results = await localSearchPokemon(query);
	if (signal?.aborted) {
		return [];
	}
	return results.map((row) => ({
		id: row.id,
		pokemon: row.pokemon,
		type_1: row.type_1,
		type_2: row.type_2
	}));
};

export const fetchRecommendation = async (
	pokemonName: string,
	mode: RecommendationMode,
	role: Role | null
): Promise<RecommendationResult> => {
	return await localRecommend(pokemonName, mode, role);
};