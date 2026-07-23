import { useState } from "react";

import { fetchRecommendation } from "../services/apiClient";
import type { RecommendationMode, RecommendationResult, Role } from "../types/recommendation";

export const useRecommendation = () => {
    const [data, setData] = useState<RecommendationResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const run = async (pokemonName: string, mode: RecommendationMode, role: Role | null) => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchRecommendation(pokemonName, mode, role);
            setData(result);
        } catch (err) {
            setData(null);
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    return { data, loading, error, run };
};