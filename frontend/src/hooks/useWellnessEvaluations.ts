import { useState, useEffect } from 'react';
import { WellnessAssessment, WellnessImpactResponse } from '../types/event.types';
import { wellnessService } from '../services/wellness.service';

export const useWellnessEvaluations = () => {
    const [pendingEvaluations, setPendingEvaluations] = useState<WellnessAssessment[]>([]);
    const [completedEvaluations, setCompletedEvaluations] = useState<WellnessAssessment[]>([]);
    const [impacts, setImpacts] = useState<Map<string, WellnessImpactResponse>>(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadWellnessEvaluations();
    }, []);

    const loadWellnessEvaluations = async () => {
        try {
            setLoading(true);
            const [pending, completed] = await Promise.all([
                wellnessService.getPendingEvaluations(),
                wellnessService.getCompletedEvaluations(),
            ]);
            setPendingEvaluations(pending);
            setCompletedEvaluations(completed);

            // Load impacts for completed evaluations
            const impactsMap = new Map<string, WellnessImpactResponse>();
            const registrationIds = new Set<string>();

            // Group evaluations by registrationId
            completed.forEach((evaluation) => {
                if (evaluation.registrationId) {
                    registrationIds.add(evaluation.registrationId);
                }
            });

            // Load impacts in parallel
            const impactPromises = Array.from(registrationIds).map(async (registrationId) => {
                try {
                    const impact = await wellnessService.getImpact(registrationId);
                    impactsMap.set(registrationId, impact);
                } catch (error) {
                    // Ignore if no impact available
                    console.log(`No impact available for registration ${registrationId}`);
                }
            });

            await Promise.all(impactPromises);
            setImpacts(impactsMap);
            setError('');
        } catch (err: any) {
            setError('Error al cargar evaluaciones');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return {
        pendingEvaluations,
        completedEvaluations,
        impacts,
        loading,
        error
    };
};
