import type {
  PokemonRecord,
  RecommendationMode,
  RecommendationOption,
  RecommendationResult,
  Role,
  StatDiff,
  StatKey
} from "../types/pokemon.js";

const STAT_KEYS: StatKey[] = [
  "hp",
  "attack",
  "defense",
  "special_attack",
  "special_defense",
  "speed"
];

const ROLE_WEIGHTS: Record<Role, Record<StatKey, number>> = {
  physicalAttacker: {
    hp: 0.1,
    attack: 0.45,
    defense: 0.15,
    special_attack: 0.05,
    special_defense: 0.05,
    speed: 0.2
  },
  specialAttacker: {
    hp: 0.1,
    attack: 0.05,
    defense: 0.1,
    special_attack: 0.45,
    special_defense: 0.1,
    speed: 0.2
  },
  tank: {
    hp: 0.35,
    attack: 0.05,
    defense: 0.25,
    special_attack: 0.0,
    special_defense: 0.3,
    speed: 0.05
  },
  speed: {
    hp: 0.05,
    attack: 0.15,
    defense: 0.05,
    special_attack: 0.15,
    special_defense: 0.05,
    speed: 0.55
  }
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

export const getSpeciesId = (id: number): number => {
  let speciesId = id;
  while (speciesId >= 10000) {
    speciesId -= 10000;
  }
  return speciesId;
};

export const getStatDiff = (from: PokemonRecord, to: PokemonRecord): StatDiff => {
  return {
    hp: statOrZero(to.hp) - statOrZero(from.hp),
    attack: statOrZero(to.attack) - statOrZero(from.attack),
    defense: statOrZero(to.defense) - statOrZero(from.defense),
    special_attack: statOrZero(to.special_attack) - statOrZero(from.special_attack),
    special_defense: statOrZero(to.special_defense) - statOrZero(from.special_defense),
    speed: statOrZero(to.speed) - statOrZero(from.speed)
  };
};

const weightedValue = (diff: StatDiff, weights: Record<StatKey, number>): number => {
  return STAT_KEYS.reduce((sum, key) => sum + diff[key] * weights[key], 0);
};

const typeAbilityAdjustment = (from: PokemonRecord, to: PokemonRecord): number => {
  let bonus = 0;
  if (from.type_2 !== to.type_2) {
    bonus += 2;
  }
  if (from.type_1 !== to.type_1) {
    bonus += 2;
  }
  if (from.ability_1 !== to.ability_1 || from.ability_2 !== to.ability_2) {
    bonus += 4;
  }
  if (to.ability_hidden && !from.ability_hidden) {
    bonus += 2;
  }
  return bonus;
};

const buildReasoning = (
  from: PokemonRecord,
  to: PokemonRecord,
  diff: StatDiff,
  mode: RecommendationMode,
  role: Role | null
): string[] => {
  const topGains = [...STAT_KEYS]
    .map((key) => ({ key, value: diff[key] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 2)
    .map((entry) => `${entry.key.replace("_", " ")} +${entry.value}`);

  const losses = STAT_KEYS.filter((key) => diff[key] < 0).map(
    (key) => `${key.replace("_", " ")} ${diff[key]}`
  );

  const bullets: string[] = [`Top gains: ${topGains.join(", ")}.`];

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
    const fromAbilities = [from.ability_1, from.ability_2, from.ability_hidden]
      .filter(Boolean)
      .join(", ");
    const toAbilities = [to.ability_1, to.ability_2, to.ability_hidden]
      .filter(Boolean)
      .join(", ");
    bullets.push(`Ability profile: ${fromAbilities || "unknown"} -> ${toAbilities || "unknown"}.`);
  }

  return bullets;
};

const toConfidence = (weightedGain: number): number => {
  const normalized = Math.max(0, Math.min(100, Math.round(45 + weightedGain * 1.8)));
  return normalized;
};

const decide = (
  options: RecommendationOption[]
): { decision: RecommendationResult["decision"]; explanation: string; confidence: number } => {
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

export const scoreEvolutionOptions = (
  current: PokemonRecord,
  options: PokemonRecord[],
  mode: RecommendationMode,
  role: Role | null
): RecommendationOption[] => {
  const baseWeights = mode === "role" && role ? ROLE_WEIGHTS[role] : RAW_WEIGHTS;

  return options
    .map((option) => {
      const diff = getStatDiff(current, option);
      let weightedGain = weightedValue(diff, baseWeights);

      if (mode === "typeAware") {
        weightedGain += typeAbilityAdjustment(current, option);
      }

      return {
        pokemon: option,
        statDiff: diff,
        weightedGain,
        confidence: toConfidence(weightedGain),
        reasoning: buildReasoning(current, option, diff, mode, role)
      } satisfies RecommendationOption;
    })
    .sort((a, b) => b.weightedGain - a.weightedGain);
};

export const createRecommendationResult = (
  current: PokemonRecord,
  chain: PokemonRecord[],
  options: PokemonRecord[],
  mode: RecommendationMode,
  role: Role | null
): RecommendationResult => {
  const scored = scoreEvolutionOptions(current, options, mode, role);
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
