import Papa from "papaparse";

import type {
  PokemonRecord,
  RecommendationMode,
  RecommendationOption,
  RecommendationResult,
  Role
} from "../types/recommendation";

const STAT_KEYS = ["hp", "attack", "defense", "special_attack", "special_defense", "speed"] as const;

type StatKey = (typeof STAT_KEYS)[number];
type CsvRow = Record<string, string>;

const normalizeName = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const parseOptionalNumber = (value: string | undefined): number | null => {
  if (value === undefined) {
    return null;
  }
  const normalized = value.trim();
  if (!normalized || normalized.toUpperCase() === "NA") {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseOptionalString = (value: string | undefined): string | null => {
  if (value === undefined) {
    return null;
  }
  const normalized = value.trim();
  if (!normalized || normalized.toUpperCase() === "NA") {
    return null;
  }
  return normalized;
};

const getSpeciesId = (id: number): number => {
  let speciesId = id;
  while (speciesId >= 10000) {
    speciesId -= 10000;
  }
  return speciesId;
};

let pokemonCachePromise: Promise<PokemonRecord[]> | null = null;

const loadPokemon = async (): Promise<PokemonRecord[]> => {
  if (pokemonCachePromise) {
    return pokemonCachePromise;
  }

  pokemonCachePromise = fetch(`${import.meta.env.BASE_URL}pokemon.csv`)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("Unable to load pokemon.csv");
      }
      return await response.text();
    })
    .then((csvText) => {
      const parsed = Papa.parse<CsvRow>(csvText, {
        header: true,
        skipEmptyLines: true
      });

      return parsed.data
        .map((row) => {
          const id = parseOptionalNumber(row.id);
          const pokemon = parseOptionalString(row.pokemon);
          if (id === null || pokemon === null) {
            return null;
          }
          return {
            id,
            pokemon,
            evolves_from_species_id: parseOptionalNumber(row.evolves_from_species_id),
            evolution_chain_id: parseOptionalNumber(row.evolution_chain_id),
            hp: parseOptionalNumber(row.hp),
            attack: parseOptionalNumber(row.attack),
            defense: parseOptionalNumber(row.defense),
            special_attack: parseOptionalNumber(row.special_attack),
            special_defense: parseOptionalNumber(row.special_defense),
            speed: parseOptionalNumber(row.speed),
            type_1: parseOptionalString(row.type_1),
            type_2: parseOptionalString(row.type_2),
            ability_1: parseOptionalString(row.ability_1),
            ability_2: parseOptionalString(row.ability_2),
            ability_hidden: parseOptionalString(row.ability_hidden)
          } satisfies PokemonRecord;
        })
        .filter((row): row is PokemonRecord => row !== null);
    });

  return pokemonCachePromise;
};

const ROLE_WEIGHTS: Record<Role, Record<StatKey, number>> = {
  physicalAttacker: { hp: 0.1, attack: 0.45, defense: 0.15, special_attack: 0.05, special_defense: 0.05, speed: 0.2 },
  specialAttacker: { hp: 0.1, attack: 0.05, defense: 0.1, special_attack: 0.45, special_defense: 0.1, speed: 0.2 },
  tank: { hp: 0.35, attack: 0.05, defense: 0.25, special_attack: 0, special_defense: 0.3, speed: 0.05 },
  speed: { hp: 0.05, attack: 0.15, defense: 0.05, special_attack: 0.15, special_defense: 0.05, speed: 0.55 }
};

const RAW_WEIGHTS: Record<StatKey, number> = {
  hp: 1 / 6,
  attack: 1 / 6,
  defense: 1 / 6,
  special_attack: 1 / 6,
  special_defense: 1 / 6,
  speed: 1 / 6
};

const statOrZero = (value: number | null): number => value ?? 0;

const getStatDiff = (from: PokemonRecord, to: PokemonRecord): Record<string, number> => ({
  hp: statOrZero(to.hp) - statOrZero(from.hp),
  attack: statOrZero(to.attack) - statOrZero(from.attack),
  defense: statOrZero(to.defense) - statOrZero(from.defense),
  special_attack: statOrZero(to.special_attack) - statOrZero(from.special_attack),
  special_defense: statOrZero(to.special_defense) - statOrZero(from.special_defense),
  speed: statOrZero(to.speed) - statOrZero(from.speed)
});

const weightedValue = (diff: Record<string, number>, weights: Record<StatKey, number>): number =>
  STAT_KEYS.reduce((sum, key) => sum + diff[key] * weights[key], 0);

const typeAbilityAdjustment = (from: PokemonRecord, to: PokemonRecord): number => {
  let bonus = 0;
  if (from.type_2 !== to.type_2) bonus += 2;
  if (from.type_1 !== to.type_1) bonus += 2;
  if (from.ability_1 !== to.ability_1 || from.ability_2 !== to.ability_2) bonus += 4;
  if (to.ability_hidden && !from.ability_hidden) bonus += 2;
  return bonus;
};

const toConfidence = (weightedGain: number): number => Math.max(0, Math.min(100, Math.round(45 + weightedGain * 1.8)));

const buildReasoning = (
  from: PokemonRecord,
  to: PokemonRecord,
  diff: Record<string, number>,
  mode: RecommendationMode,
  role: Role | null
): string[] => {
  const topGains = [...STAT_KEYS]
    .map((key) => ({ key, value: diff[key] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 2)
    .map((entry) => `${entry.key.replace("_", " ")} +${entry.value}`);

  const losses = STAT_KEYS.filter((key) => diff[key] < 0).map((key) => `${key.replace("_", " ")} ${diff[key]}`);

  const bullets = [`Top gains: ${topGains.join(", ")}.`];
  if (losses.length > 0) {
    bullets.push(`Tradeoffs: ${losses.join(", ")}.`);
  }
  if (mode === "role" && role) {
    bullets.push(`Role mode prioritizes ${role}.`);
  }
  if (mode === "typeAware") {
    const fromTypes = [from.type_1, from.type_2].filter(Boolean).join("/") || "unknown";
    const toTypes = [to.type_1, to.type_2].filter(Boolean).join("/") || "unknown";
    bullets.push(`Type profile: ${fromTypes} -> ${toTypes}.`);
    const fromAbilities = [from.ability_1, from.ability_2, from.ability_hidden].filter(Boolean).join(", ");
    const toAbilities = [to.ability_1, to.ability_2, to.ability_hidden].filter(Boolean).join(", ");
    bullets.push(`Ability profile: ${fromAbilities || "unknown"} -> ${toAbilities || "unknown"}.`);
  }
  return bullets;
};

const decide = (options: RecommendationOption[]): { decision: RecommendationResult["decision"]; explanation: string; confidence: number } => {
  if (options.length === 0) {
    return {
      decision: "Wait",
      explanation: "This Pokemon has no further evolution in its chain.",
      confidence: 100
    };
  }

  const best = options[0];
  const bigLoss = Object.values(best.statDiff).some((value) => value <= -12);

  if (best.weightedGain >= 16 && !bigLoss) {
    return {
      decision: "Yes, evolve now",
      explanation: `${best.pokemon.pokemon} gives the strongest overall gain right now.`,
      confidence: best.confidence
    };
  }

  if (best.weightedGain <= 6) {
    return {
      decision: "Wait",
      explanation: "The immediate stat upside is small for now.",
      confidence: best.confidence
    };
  }

  return {
    decision: "It depends",
    explanation: "There are gains, but notable tradeoffs make the choice situational.",
    confidence: best.confidence
  };
};

const getChain = (rows: PokemonRecord[], current: PokemonRecord): PokemonRecord[] => {
  if (current.evolution_chain_id === null) {
    return [current];
  }

  const chainRows = rows.filter((row) => row.evolution_chain_id === current.evolution_chain_id);
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
};

const getNextOptions = (chain: PokemonRecord[], current: PokemonRecord): PokemonRecord[] => {
  const speciesId = getSpeciesId(current.id);
  return chain.filter((candidate) => {
    if (candidate.id === current.id) {
      return false;
    }
    const evolvesFrom = candidate.evolves_from_species_id;
    return evolvesFrom !== null && (evolvesFrom === current.id || evolvesFrom === speciesId);
  });
};

const scoreOptions = (
  current: PokemonRecord,
  options: PokemonRecord[],
  mode: RecommendationMode,
  role: Role | null
): RecommendationOption[] => {
  const baseWeights = mode === "role" && role ? ROLE_WEIGHTS[role] : RAW_WEIGHTS;

  return options
    .map((option) => {
      const statDiff = getStatDiff(current, option);
      let weightedGain = weightedValue(statDiff, baseWeights);
      if (mode === "typeAware") {
        weightedGain += typeAbilityAdjustment(current, option);
      }
      return {
        pokemon: option,
        statDiff,
        weightedGain,
        confidence: toConfidence(weightedGain),
        reasoning: buildReasoning(current, option, statDiff, mode, role)
      } satisfies RecommendationOption;
    })
    .sort((a, b) => b.weightedGain - a.weightedGain);
};

export const localSearchPokemon = async (query: string): Promise<PokemonRecord[]> => {
  const rows = await loadPokemon();
  const normalized = normalizeName(query);
  if (!normalized) {
    return [];
  }
  return rows
    .filter((row) => normalizeName(row.pokemon).includes(normalized))
    .sort((a, b) => a.pokemon.localeCompare(b.pokemon))
    .slice(0, 8);
};

export const localRecommend = async (
  pokemonName: string,
  mode: RecommendationMode,
  role: Role | null
): Promise<RecommendationResult> => {
  const rows = await loadPokemon();
  const normalized = normalizeName(pokemonName);
  const current = rows.find((row) => normalizeName(row.pokemon) === normalized);

  if (!current) {
    throw new Error("Pokemon not found");
  }

  const chain = getChain(rows, current);
  const options = getNextOptions(chain, current);
  const scored = scoreOptions(current, options, mode, role);
  const decision = decide(scored);

  return {
    ...decision,
    current,
    options: scored,
    chain,
    mode,
    role
  };
};
