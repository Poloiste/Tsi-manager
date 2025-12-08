import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Hook de gamification pour gérer les badges, XP, streaks et statistiques
 * @param {string} userId - ID de l'utilisateur connecté
 * @returns {Object} État et fonctions de gamification
 */
export function useGamification(userId) {
  // États
  const [badges, setBadges] = useState([]);
  const [unlockedBadges, setUnlockedBadges] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [dailyStats, setDailyStats] = useState([]);
  const [newBadge, setNewBadge] = useState(null); // Pour l'animation de déblocage
  const [isLoading, setIsLoading] = useState(true);

  // Charger tous les badges disponibles
  const loadBadges = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('condition_value', { ascending: true });

      if (error) throw error;
      setBadges(data || []);
    } catch (error) {
      console.error('Error loading badges:', error);
    }
  }, []);

  // Charger les badges débloqués par l'utilisateur
  const loadUserBadges = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          *,
          badges:badge_id (*)
        `)
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;
      setUnlockedBadges(data || []);
    } catch (error) {
      console.error('Error loading user badges:', error);
    }
  }, [userId]);

  // Charger le profil utilisateur (XP, streak, etc.)
  const loadUserProfile = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setUserProfile(data);
      } else {
        // Créer un profil par défaut si aucun n'existe
        const { data: newProfile, error: insertError } = await supabase
          .from('user_profiles')
          .insert([{ user_id: userId }])
          .select()
          .single();

        if (insertError) throw insertError;
        setUserProfile(newProfile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }, [userId]);

  // Charger les statistiques des X derniers jours
  const loadDailyStats = useCallback(async (days = 90) => {
    if (!userId) return;

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('user_daily_stats')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDateStr)
        .order('date', { ascending: true });

      if (error) throw error;
      setDailyStats(data || []);
    } catch (error) {
      console.error('Error loading daily stats:', error);
    }
  }, [userId]);

  // Vérifier et débloquer de nouveaux badges
  const checkAndUnlockBadges = useCallback(async () => {
    if (!userId || !userProfile) return;

    try {
      // Récupérer tous les badges
      const { data: allBadges, error: badgesError } = await supabase
        .from('badges')
        .select('*');

      if (badgesError) throw badgesError;

      // Récupérer les badges déjà débloqués
      const { data: unlockedBadgeIds, error: unlockedError } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', userId);

      if (unlockedError) throw unlockedError;

      const unlockedIds = new Set(unlockedBadgeIds.map(ub => ub.badge_id));
      const newlyUnlocked = [];

      // Vérifier chaque badge
      for (const badge of allBadges) {
        // Skip si déjà débloqué
        if (unlockedIds.has(badge.id)) continue;

        let shouldUnlock = false;

        switch (badge.condition_type) {
          case 'streak':
            shouldUnlock = userProfile.current_streak >= badge.condition_value;
            break;
          case 'mastery':
            // Compter les cartes avec un intervalle > 21 jours
            // Pour l'instant, on utilise une estimation basée sur les révisions
            // TODO: Implémenter le comptage réel des cartes maîtrisées
            shouldUnlock = false; // Placeholder
            break;
          case 'cards_created':
            shouldUnlock = userProfile.cards_created >= badge.condition_value;
            break;
          case 'sessions_count':
            shouldUnlock = userProfile.sessions_count >= badge.condition_value;
            break;
          default:
            break;
        }

        if (shouldUnlock) {
          // Débloquer le badge
          const { error: unlockError } = await supabase
            .from('user_badges')
            .insert([{
              user_id: userId,
              badge_id: badge.id
            }]);

          if (!unlockError) {
            newlyUnlocked.push(badge);
            // Ajouter l'XP du badge
            await addXP(badge.xp_reward);
          }
        }
      }

      // Si des badges ont été débloqués, afficher le premier
      if (newlyUnlocked.length > 0) {
        setNewBadge(newlyUnlocked[0]);
        // Recharger les badges débloqués
        await loadUserBadges();
      }

      return newlyUnlocked;
    } catch (error) {
      console.error('Error checking badges:', error);
      return [];
    }
  }, [userId, userProfile, loadUserBadges]);

  // Ajouter de l'XP au profil
  const addXP = useCallback(async (amount) => {
    if (!userId || !userProfile) return;

    try {
      const newTotalXP = (userProfile.total_xp || 0) + amount;

      const { error } = await supabase
        .from('user_profiles')
        .update({
          total_xp: newTotalXP,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Mettre à jour le state local
      setUserProfile(prev => ({
        ...prev,
        total_xp: newTotalXP
      }));
    } catch (error) {
      console.error('Error adding XP:', error);
    }
  }, [userId, userProfile]);

  // Mettre à jour les statistiques du jour
  const updateDailyStats = useCallback(async (stats) => {
    if (!userId) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      // Récupérer les stats du jour
      const { data: existingStats, error: fetchError } = await supabase
        .from('user_daily_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingStats) {
        // Mettre à jour les stats existantes
        const { error: updateError } = await supabase
          .from('user_daily_stats')
          .update({
            reviews_count: existingStats.reviews_count + (stats.reviews_count || 0),
            correct_count: existingStats.correct_count + (stats.correct_count || 0),
            incorrect_count: existingStats.incorrect_count + (stats.incorrect_count || 0),
            xp_earned: existingStats.xp_earned + (stats.xp_earned || 0),
            sessions_count: existingStats.sessions_count + (stats.sessions_count || 0),
            time_spent_minutes: existingStats.time_spent_minutes + (stats.time_spent_minutes || 0)
          })
          .eq('id', existingStats.id);

        if (updateError) throw updateError;
      } else {
        // Créer de nouvelles stats
        const { error: insertError } = await supabase
          .from('user_daily_stats')
          .insert([{
            user_id: userId,
            date: today,
            ...stats
          }]);

        if (insertError) throw insertError;
      }

      // Mettre à jour le profil utilisateur
      await updateUserProfile(stats);

      // Recharger les stats
      await loadDailyStats();
    } catch (error) {
      console.error('Error updating daily stats:', error);
    }
  }, [userId, loadDailyStats]);

  // Mettre à jour le profil utilisateur après une activité
  const updateUserProfile = useCallback(async (stats) => {
    if (!userId || !userProfile) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const lastActivityDate = userProfile.last_activity_date;

      // Calculer le streak
      let newStreak = userProfile.current_streak || 0;
      let newLongestStreak = userProfile.longest_streak || 0;

      if (lastActivityDate) {
        const lastDate = new Date(lastActivityDate);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
          // Même jour, pas de changement de streak
        } else if (diffDays === 1) {
          // Jour consécutif
          newStreak += 1;
        } else {
          // Streak cassé
          newStreak = 1;
        }
      } else {
        // Première activité
        newStreak = 1;
      }

      // Mettre à jour le plus long streak
      newLongestStreak = Math.max(newLongestStreak, newStreak);

      // Mettre à jour le profil
      const { error } = await supabase
        .from('user_profiles')
        .update({
          current_streak: newStreak,
          longest_streak: newLongestStreak,
          total_reviews: (userProfile.total_reviews || 0) + (stats.reviews_count || 0),
          correct_reviews: (userProfile.correct_reviews || 0) + (stats.correct_count || 0),
          incorrect_reviews: (userProfile.incorrect_reviews || 0) + (stats.incorrect_count || 0),
          sessions_count: (userProfile.sessions_count || 0) + (stats.sessions_count || 0),
          last_activity_date: today,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Recharger le profil
      await loadUserProfile();

      // Vérifier les badges après mise à jour du profil
      await checkAndUnlockBadges();
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  }, [userId, userProfile, loadUserProfile, checkAndUnlockBadges]);

  // Incrémenter le nombre de cartes créées
  const incrementCardsCreated = useCallback(async (count = 1) => {
    if (!userId || !userProfile) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          cards_created: (userProfile.cards_created || 0) + count,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Recharger le profil
      await loadUserProfile();

      // Vérifier les badges
      await checkAndUnlockBadges();
    } catch (error) {
      console.error('Error incrementing cards created:', error);
    }
  }, [userId, userProfile, loadUserProfile, checkAndUnlockBadges]);

  // Charger toutes les données au montage
  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      await Promise.all([
        loadBadges(),
        loadUserBadges(),
        loadUserProfile(),
        loadDailyStats()
      ]);
      setIsLoading(false);
    };

    if (userId) {
      loadAll();
    }
  }, [userId, loadBadges, loadUserBadges, loadUserProfile, loadDailyStats]);

  return {
    // États
    badges,
    unlockedBadges,
    userProfile,
    dailyStats,
    newBadge,
    isLoading,

    // Fonctions
    loadBadges,
    loadUserBadges,
    loadUserProfile,
    loadDailyStats,
    checkAndUnlockBadges,
    addXP,
    updateDailyStats,
    incrementCardsCreated,
    setNewBadge // Pour fermer le modal de badge
  };
}
