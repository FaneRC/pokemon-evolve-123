export type RecommendationMode = "raw" | "role" | "typeAware";
export type Role = "physicalAttacker" | "specialAttacker" | "tank" | "speed";

export type PokemonLite = {
	id: number;
	pokemon: string;
	type_1: string | null;
	type_2: string | null;
};

export type PokemonRecord = {
	id: number;
	pokemon: string;
	evolves_from_species_id: number | null;
	evolution_chain_id: number | null;
	hp: number | null;
	attack: number | null;
	defense: number | null;
	special_attack: number | null;
	special_defense: number | null;
	speed: number | null;
	type_1: string | null;
	type_2: string | null;
	ability_1: string | null;
	ability_2: string | null;
	ability_hidden: string | null;
};

export type RecommendationOption = {
	pokemon: PokemonRecord;
	statDiff: Record<string, number>;
	weightedGain: number;
	confidence: number;
	reasoning: string[];
};

export type RecommendationResult = {
	decision: "Yes, evolve now" | "Wait" | "It depends";
	explanation: string;
	confidence: number;
	current: PokemonRecord;
	options: RecommendationOption[];
	chain: PokemonRecord[];
	mode: RecommendationMode;
	role: Role | null;
};