import type { Request, Response } from "express";

import type { RecommendationMode, Role } from "../types/pokemon.js";
import { recommendationService } from "../services/serviceSingleton.js";

const MODES: RecommendationMode[] = ["raw", "role", "typeAware"];
const ROLES: Role[] = ["physicalAttacker", "specialAttacker", "tank", "speed"];

export const searchPokemon = (req: Request, res: Response): void => {
	const query = String(req.query.q ?? "");
	const results = recommendationService.search(query);
	res.json(
		results.map((row) => ({
			id: row.id,
			pokemon: row.pokemon,
			type_1: row.type_1,
			type_2: row.type_2
		}))
	);
};

export const getRecommendation = (req: Request, res: Response): void => {
	const pokemonName = String(req.body?.pokemonName ?? "").trim();
	const mode = req.body?.mode as RecommendationMode;
	const role = req.body?.role as Role | null;

	if (!pokemonName) {
		res.status(400).json({ message: "pokemonName is required" });
		return;
	}

	if (!MODES.includes(mode)) {
		res.status(400).json({ message: "mode must be one of raw, role, typeAware" });
		return;
	}

	if (role !== null && role !== undefined && !ROLES.includes(role)) {
		res.status(400).json({ message: "Invalid role" });
		return;
	}

	try {
		const result = recommendationService.recommend(pokemonName, mode, role ?? null);
		res.json(result);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		res.status(404).json({ message });
	}
};