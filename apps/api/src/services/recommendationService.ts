import { createRecommendationResult, getSpeciesId } from "../lib/recommendation.js";
import type { PokemonRecord, RecommendationMode, RecommendationResult, Role } from "../types/pokemon.js";
import { normalizeName } from "../utils/normalize.js";

export class RecommendationService {
	constructor(private readonly rows: PokemonRecord[]) {}

	search(query: string, limit = 8): PokemonRecord[] {
		const normalized = normalizeName(query);
		if (!normalized) {
			return [];
		}

		return this.rows
			.filter((row) => normalizeName(row.pokemon).includes(normalized))
			.sort((a, b) => a.pokemon.localeCompare(b.pokemon))
			.slice(0, limit);
	}

	getByName(name: string): PokemonRecord | null {
		const normalized = normalizeName(name);
		return this.rows.find((row) => normalizeName(row.pokemon) === normalized) ?? null;
	}

	recommend(name: string, mode: RecommendationMode, role: Role | null): RecommendationResult {
		const current = this.getByName(name);
		if (!current) {
			throw new Error("Pokemon not found");
		}

		const chain = this.getChain(current);
		const options = this.getNextOptions(current, chain);

		return createRecommendationResult(current, chain, options, mode, role);
	}

	private getChain(current: PokemonRecord): PokemonRecord[] {
		if (current.evolution_chain_id === null) {
			return [current];
		}

		const chainRows = this.rows.filter((row) => row.evolution_chain_id === current.evolution_chain_id);
		const bySpeciesId = new Map<number, PokemonRecord>();

		for (const row of chainRows) {
			const speciesId = getSpeciesId(row.id);
			if (!bySpeciesId.has(speciesId) || row.id < (bySpeciesId.get(speciesId)?.id ?? Number.MAX_SAFE_INTEGER)) {
				bySpeciesId.set(speciesId, row);
			}
		}

		const depthCache = new Map<number, number>();
		const getDepth = (row: PokemonRecord): number => {
			if (depthCache.has(row.id)) {
				return depthCache.get(row.id) ?? 0;
			}

			const parentSpeciesId = row.evolves_from_species_id;
			if (parentSpeciesId === null) {
				depthCache.set(row.id, 0);
				return 0;
			}

			const parent = bySpeciesId.get(parentSpeciesId);
			if (!parent || parent.id === row.id) {
				depthCache.set(row.id, 0);
				return 0;
			}

			const depth = getDepth(parent) + 1;
			depthCache.set(row.id, depth);
			return depth;
		};

		return chainRows.sort((a, b) => {
			const depthDiff = getDepth(a) - getDepth(b);
			if (depthDiff !== 0) {
				return depthDiff;
			}
			return a.id - b.id;
		});
	}

	private getNextOptions(current: PokemonRecord, chain: PokemonRecord[]): PokemonRecord[] {
		const speciesId = getSpeciesId(current.id);
		return chain.filter((candidate) => {
			if (candidate.id === current.id) {
				return false;
			}
			const evolvesFrom = candidate.evolves_from_species_id;
			return evolvesFrom !== null && (evolvesFrom === current.id || evolvesFrom === speciesId);
		});
	}
}