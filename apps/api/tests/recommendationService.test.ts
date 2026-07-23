import { describe, expect, it } from "vitest";

import type { PokemonRecord } from "../src/types/pokemon.js";
import { RecommendationService } from "../src/services/recommendationService.js";

const rows: PokemonRecord[] = [
	{
		id: 172,
		pokemon: "Pichu",
		evolves_from_species_id: null,
		evolution_chain_id: 10,
		hp: 20,
		attack: 40,
		defense: 15,
		special_attack: 35,
		special_defense: 35,
		speed: 60,
		type_1: "electric",
		type_2: null,
		ability_1: "Static",
		ability_2: null,
		ability_hidden: "Lightning Rod"
	},
	{
		id: 25,
		pokemon: "Pikachu",
		evolves_from_species_id: 172,
		evolution_chain_id: 10,
		hp: 35,
		attack: 55,
		defense: 40,
		special_attack: 50,
		special_defense: 50,
		speed: 90,
		type_1: "electric",
		type_2: null,
		ability_1: "Static",
		ability_2: null,
		ability_hidden: "Lightning Rod"
	},
	{
		id: 26,
		pokemon: "Raichu",
		evolves_from_species_id: 25,
		evolution_chain_id: 10,
		hp: 60,
		attack: 90,
		defense: 55,
		special_attack: 90,
		special_defense: 80,
		speed: 110,
		type_1: "electric",
		type_2: null,
		ability_1: "Static",
		ability_2: null,
		ability_hidden: "Lightning Rod"
	},
	{
		id: 133,
		pokemon: "Eevee",
		evolves_from_species_id: null,
		evolution_chain_id: 67,
		hp: 55,
		attack: 55,
		defense: 50,
		special_attack: 45,
		special_defense: 65,
		speed: 55,
		type_1: "normal",
		type_2: null,
		ability_1: "Run Away",
		ability_2: "Adaptability",
		ability_hidden: "Anticipation"
	},
	{
		id: 134,
		pokemon: "Vaporeon",
		evolves_from_species_id: 133,
		evolution_chain_id: 67,
		hp: 130,
		attack: 65,
		defense: 60,
		special_attack: 110,
		special_defense: 95,
		speed: 65,
		type_1: "water",
		type_2: null,
		ability_1: "Water Absorb",
		ability_2: null,
		ability_hidden: "Hydration"
	},
	{
		id: 135,
		pokemon: "Jolteon",
		evolves_from_species_id: 133,
		evolution_chain_id: 67,
		hp: 65,
		attack: 65,
		defense: 60,
		special_attack: 110,
		special_defense: 95,
		speed: 130,
		type_1: "electric",
		type_2: null,
		ability_1: "Volt Absorb",
		ability_2: null,
		ability_hidden: "Quick Feet"
	}
];

describe("RecommendationService", () => {
	const service = new RecommendationService(rows);

	it("searches case-insensitively", () => {
		const result = service.search("eeV");
		expect(result[0]?.pokemon).toBe("Eevee");
	});

	it("returns branching options", () => {
		const recommendation = service.recommend("Eevee", "raw", null);
		expect(recommendation.options.length).toBe(2);
	});

	it("returns role-aware choice", () => {
		const recommendation = service.recommend("Eevee", "role", "speed");
		expect(recommendation.options[0]?.pokemon.pokemon).toBe("Jolteon");
	});

	it("orders chain from base form to final evolution", () => {
		const recommendation = service.recommend("Pikachu", "raw", null);
		expect(recommendation.chain.map((item) => item.pokemon)).toEqual(["Pichu", "Pikachu", "Raichu"]);
	});
});