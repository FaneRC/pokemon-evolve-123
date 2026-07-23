import { describe, expect, it } from "vitest";

import { scoreEvolutionOptions } from "../src/lib/recommendation.js";
import type { PokemonRecord } from "../src/types/pokemon.js";

const eevee: PokemonRecord = {
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
};

const vaporeon: PokemonRecord = {
	...eevee,
	id: 134,
	pokemon: "Vaporeon",
	evolves_from_species_id: 133,
	hp: 130,
	attack: 65,
	defense: 60,
	special_attack: 110,
	special_defense: 95,
	speed: 65,
	type_1: "water",
	ability_1: "Water Absorb",
	ability_2: null,
	ability_hidden: "Hydration"
};

const jolteon: PokemonRecord = {
	...eevee,
	id: 135,
	pokemon: "Jolteon",
	evolves_from_species_id: 133,
	hp: 65,
	attack: 65,
	defense: 60,
	special_attack: 110,
	special_defense: 95,
	speed: 130,
	type_1: "electric",
	ability_1: "Volt Absorb",
	ability_2: null,
	ability_hidden: "Quick Feet"
};

describe("scoreEvolutionOptions", () => {
	it("prioritizes speed evolution for speed role", () => {
		const results = scoreEvolutionOptions(eevee, [vaporeon, jolteon], "role", "speed");
		expect(results[0]?.pokemon.pokemon).toBe("Jolteon");
	});

	it("includes reasoning bullets in type-aware mode", () => {
		const results = scoreEvolutionOptions(eevee, [vaporeon], "typeAware", null);
		expect(results[0]?.reasoning.length).toBeGreaterThan(1);
	});
});