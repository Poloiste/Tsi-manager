import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { createDebugLogger } from '../utils/guardUtils';

// Development logging utility
const isDev = process.env.NODE_ENV === 'development';
const logger = createDebugLogger('useStudyGroups');
const log = (...args) => {
  if (isDev) console.log(...args);
};
const logWarn = (...args) => {
  if (isDev) console.warn(...args);
};
const logError = (...args) => console.error(...args); // Always log errors

/**
 * Hook de gestion des groupes d'étude
 * @param {string} userId - ID de l'utilisateur connecté
 * @returns {Object} État et fonctions de gestion des groupes
 */
export function useStudyGroups(userId) {
  // États
  const [myGroups, setMyGroups] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Charger mes groupes (groupes dont je suis membre)
  const loadMyGroups = useCallback(async () => {
    if (!userId) return;

    logger.log('loadMyGroups called for userId:', userId);
    setIsLoading(true);
    try {
      // Récupérer mes groupes avec le nombre de membres en une seule requête
      const { data, error } = await supabase
        .from('study_group_members')
        .select(`
          *,
          study_groups:group_id (
            id,
            name,
            description,
            is_public,
            max_members,
            invite_code,
            created_by,
            created_at
          )
        `)
        .eq('user_id', userId)
        .order('joined_at', { ascending: false });

      if (error) {
        logError('Error fetching group memberships:', error);
        throw error;
      }

      logger.log('Memberships found:', data?.length || 0, 
        data?.length > 0 ? `(first: ${data[0]?.study_groups?.name || 'N/A'})` : '');

      // Récupérer les comptes de membres pour tous les groupes en une seule requête
      const groupIds = (data || []).map(m => m.study_groups.id);
      
      if (groupIds.length === 0) {
        logger.log('No group memberships found for user');
        setMyGroups([]);
        return;
      }

      logger.log('Fetching member counts for', groupIds.length, 'groups');

      const { data: memberCounts, error: countError } = await supabase
        .from('study_group_members')
        .select('group_id')
        .in('group_id', groupIds);

      if (countError) {
        logError('Error fetching member counts:', countError);
        throw countError;
      }

      // Compter les membres par groupe
      const countsMap = {};
      (memberCounts || []).forEach(m => {
        countsMap[m.group_id] = (countsMap[m.group_id] || 0) + 1;
      });

      const groupsWithCounts = (data || []).map((membership) => ({
        ...membership.study_groups,
        memberCount: countsMap[membership.study_groups.id] || 0,
        myRole: membership.role,
        joinedAt: membership.joined_at
      }));

      const privateCount = groupsWithCounts.filter(g => !g.is_public).length;
      const publicCount = groupsWithCounts.filter(g => g.is_public).length;
      logger.log('loadMyGroups completed:', 
        `${groupsWithCounts.length} total (${privateCount} private, ${publicCount} public)`);

      setMyGroups(groupsWithCounts);
    } catch (error) {
      logError('Error loading my groups:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Charger les groupes publics disponibles
  const loadAvailableGroups = useCallback(async () => {
    if (!userId) return;

    logger.log('loadAvailableGroups called for userId:', userId);
    setIsLoading(true);
    try {
      // Récupérer les IDs des groupes dont je suis déjà membre
      const { data: myMemberships } = await supabase
        .from('study_group_members')
        .select('group_id')
        .eq('user_id', userId);

      const myGroupIds = (myMemberships || []).map(m => m.group_id);

      // Récupérer les groupes publics dont je ne suis pas membre
      let query = supabase
        .from('study_groups')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (myGroupIds.length > 0) {
        query = query.not('id', 'in', `(${myGroupIds.join(',')})`);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        setAvailableGroups([]);
        return;
      }

      // Récupérer les comptes de membres pour tous les groupes en une seule requête
      const groupIds = data.map(g => g.id);
      
      const { data: memberCounts, error: countError } = await supabase
        .from('study_group_members')
        .select('group_id')
        .in('group_id', groupIds);

      if (countError) throw countError;

      // Compter les membres par groupe
      const countsMap = {};
      (memberCounts || []).forEach(m => {
        countsMap[m.group_id] = (countsMap[m.group_id] || 0) + 1;
      });

      const groupsWithCounts = data.map((group) => ({
        ...group,
        memberCount: countsMap[group.id] || 0
      }));

      setAvailableGroups(groupsWithCounts);
    } catch (error) {
      logError('Error loading available groups:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Créer un nouveau groupe
  const createGroup = useCallback(async (data) => {
    if (!userId) throw new Error('User not authenticated');

    logger.log('createGroup called:', data.name, 
      `(${data.isPublic ? 'public' : 'private'})`);
    setIsLoading(true);
    try {
      const groupData = {
        name: data.name,
        description: data.description || '',
        is_public: data.isPublic !== undefined ? data.isPublic : true,
        max_members: data.maxMembers || 20,
        created_by: userId
      };
      
      const { data: newGroup, error } = await supabase
        .from('study_groups')
        .insert([groupData])
        .select()
        .single();

      if (error) {
        logError('Error creating group:', error);
        throw error;
      }

      logger.log('Group created successfully:', newGroup.id, 
        `is_public=${newGroup.is_public}`);

      // Recharger mes groupes
      await loadMyGroups();

      return newGroup;
    } catch (error) {
      logError('Error creating group:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userId, loadMyGroups]);

  // Rejoindre un groupe public
  const joinGroup = useCallback(async (groupId) => {
    if (!userId) throw new Error('User not authenticated');

    setIsLoading(true);
    try {
      // Vérifier que le groupe est public et n'est pas plein
      const { data: group, error: groupError } = await supabase
        .from('study_groups')
        .select('*, study_group_members(count)')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;
      if (!group.is_public) throw new Error('Ce groupe est privé');

      const { count } = await supabase
        .from('study_group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId);

      if (count >= group.max_members) {
        throw new Error('Ce groupe est complet');
      }

      // Rejoindre le groupe
      const { error: joinError } = await supabase
        .from('study_group_members')
        .insert([{
          group_id: groupId,
          user_id: userId,
          role: 'member'
        }]);

      if (joinError) throw joinError;

      // Enregistrer l'activité
      await supabase
        .from('study_group_activities')
        .insert([{
          group_id: groupId,
          user_id: userId,
          activity_type: 'join',
          activity_data: {}
        }]);

      // Recharger les groupes
      await loadMyGroups();
      await loadAvailableGroups();
    } catch (error) {
      logError('Error joining group:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userId, loadMyGroups, loadAvailableGroups]);

  // Rejoindre par code d'invitation
  const joinByCode = useCallback(async (code) => {
    if (!userId) throw new Error('User not authenticated');

    setIsLoading(true);
    try {
      // Trouver le groupe par code
      const { data: group, error: groupError } = await supabase
        .from('study_groups')
        .select('*')
        .eq('invite_code', code.toUpperCase())
        .single();

      if (groupError || !group) {
        throw new Error('Code d\'invitation invalide');
      }

      // Vérifier l'expiration
      if (group.invite_code_expires_at && new Date(group.invite_code_expires_at) < new Date()) {
        throw new Error('Ce code d\'invitation a expiré');
      }

      // Vérifier que le groupe n'est pas plein
      const { count } = await supabase
        .from('study_group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', group.id);

      if (count >= group.max_members) {
        throw new Error('Ce groupe est complet');
      }

      // Vérifier que l'utilisateur n'est pas déjà membre
      const { data: existingMember } = await supabase
        .from('study_group_members')
        .select('*')
        .eq('group_id', group.id)
        .eq('user_id', userId)
        .single();

      if (existingMember) {
        throw new Error('Vous êtes déjà membre de ce groupe');
      }

      // Rejoindre le groupe
      const { error: joinError } = await supabase
        .from('study_group_members')
        .insert([{
          group_id: group.id,
          user_id: userId,
          role: 'member'
        }]);

      if (joinError) throw joinError;

      // Enregistrer l'activité
      await supabase
        .from('study_group_activities')
        .insert([{
          group_id: group.id,
          user_id: userId,
          activity_type: 'join',
          activity_data: { via: 'invite_code' }
        }]);

      // Recharger les groupes
      await loadMyGroups();
      await loadAvailableGroups();

      return group;
    } catch (error) {
      logError('Error joining by code:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userId, loadMyGroups, loadAvailableGroups]);

  // Quitter un groupe
  const leaveGroup = useCallback(async (groupId) => {
    if (!userId) throw new Error('User not authenticated');

    setIsLoading(true);
    try {
      // Vérifier que l'utilisateur n'est pas le seul admin
      const { data: admins } = await supabase
        .from('study_group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('role', 'admin');

      const { data: myMembership } = await supabase
        .from('study_group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single();

      if (myMembership.role === 'admin' && admins.length === 1) {
        throw new Error('Vous êtes le seul admin. Nommez un autre admin avant de quitter.');
      }

      // Quitter le groupe
      const { error } = await supabase
        .from('study_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) throw error;

      // Enregistrer l'activité
      await supabase
        .from('study_group_activities')
        .insert([{
          group_id: groupId,
          user_id: userId,
          activity_type: 'leave',
          activity_data: {}
        }]);

      // Recharger les groupes
      await loadMyGroups();
      await loadAvailableGroups();
    } catch (error) {
      logError('Error leaving group:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userId, loadMyGroups, loadAvailableGroups]);

  // Supprimer un groupe (créateur seulement)
  const deleteGroup = useCallback(async (groupId) => {
    if (!userId) throw new Error('User not authenticated');

    setIsLoading(true);
    try {
      // Vérifier que l'utilisateur est le créateur du groupe
      const { data: group, error: groupError } = await supabase
        .from('study_groups')
        .select('created_by')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;

      if (group.created_by !== userId) {
        throw new Error('Seul le créateur peut supprimer ce groupe');
      }

      // Supprimer le groupe (cascade supprimera les membres, decks, activités, messages)
      const { error } = await supabase
        .from('study_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      // Recharger les groupes
      await loadMyGroups();
      await loadAvailableGroups();
    } catch (error) {
      logError('Error deleting group:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userId, loadMyGroups, loadAvailableGroups]);

  // Inviter un membre par email (optionnel - pas implémenté dans ce prototype)
  const inviteMember = useCallback(async (groupId, email) => {
    // Cette fonctionnalité nécessiterait l'envoi d'emails
    // Pour l'instant, on peut simplement générer un code que l'admin peut partager
    log('Invite member feature:', groupId, email);
    throw new Error('Utilisez le code d\'invitation pour inviter des membres');
  }, []);

  // Générer un nouveau code d'invitation
  const generateInviteCode = useCallback(async (groupId) => {
    if (!userId) throw new Error('User not authenticated');

    setIsLoading(true);
    try {
      // Vérifier que l'utilisateur est admin
      const { data: membership } = await supabase
        .from('study_group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .eq('role', 'admin')
        .single();

      if (!membership) {
        throw new Error('Seuls les admins peuvent générer un code');
      }

      // Générer un nouveau code côté client
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let newCode = '';
      for (let i = 0; i < 6; i++) {
        newCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Mettre à jour le groupe avec le nouveau code
      const { error: updateError } = await supabase
        .from('study_groups')
        .update({
          invite_code: newCode,
          invite_code_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', groupId);

      if (updateError) throw updateError;

      await loadMyGroups();
      return newCode;
    } catch (error) {
      logError('Error generating invite code:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userId, loadMyGroups]);

  // Charger les détails d'un groupe
  const loadGroupDetails = useCallback(async (groupId) => {
    if (!userId) {
      logWarn('[useStudyGroups] loadGroupDetails called without userId');
      return;
    }

    log('[useStudyGroups] Loading details for group:', groupId);
    setIsLoading(true);
    try {
      // Charger le groupe
      log('[useStudyGroups] Fetching group data...');
      const { data: group, error: groupError } = await supabase
        .from('study_groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError) {
        logError('[useStudyGroups] Error fetching group:', groupError);
        throw new Error(`Impossible de charger le groupe: ${groupError?.message || 'Erreur inconnue'}`);
      }
      log('[useStudyGroups] Group data loaded:', group);

      // Charger les membres
      log('[useStudyGroups] Fetching members...');
      const { data: members, error: membersError } = await supabase
        .from('study_group_members')
        .select('*')
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true });

      if (membersError) {
        logError('[useStudyGroups] Error fetching members:', membersError);
        throw new Error(`Impossible de charger les membres: ${membersError?.message || 'Erreur inconnue'}`);
      }
      log('[useStudyGroups] Members loaded:', members?.length || 0, 'members');

      // Charger les decks partagés
      log('[useStudyGroups] Fetching shared decks...');
      const { data: sharedDecks, error: decksError } = await supabase
        .from('study_group_shared_decks')
        .select(`
          *,
          shared_courses:course_id (
            id,
            subject,
            chapter,
            difficulty
          )
        `)
        .eq('group_id', groupId)
        .order('shared_at', { ascending: false });

      if (decksError) {
        logError('[useStudyGroups] Error fetching shared decks:', decksError);
        // Don't throw, just log - shared decks are optional
        logWarn('[useStudyGroups] Continuing without shared decks');
      }
      log('[useStudyGroups] Shared decks loaded:', sharedDecks?.length || 0, 'decks');

      // Charger les activités récentes
      log('[useStudyGroups] Fetching activities...');
      const { data: activities, error: activitiesError } = await supabase
        .from('study_group_activities')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (activitiesError) {
        logError('[useStudyGroups] Error fetching activities:', activitiesError);
        // Don't throw, just log - activities are optional
        logWarn('[useStudyGroups] Continuing without activities');
      }
      log('[useStudyGroups] Activities loaded:', activities?.length || 0, 'activities');

      const groupDetails = {
        ...group,
        members: members || [],
        sharedDecks: sharedDecks || [],
        activities: activities || []
      };

      log('[useStudyGroups] Group details assembled successfully');
      setCurrentGroup(groupDetails);
      return groupDetails;
    } catch (error) {
      logError('[useStudyGroups] Fatal error loading group details:', error);
      throw error;
    } finally {
      setIsLoading(false);
      log('[useStudyGroups] loadGroupDetails completed');
    }
  }, [userId]);

  // Charger le leaderboard du groupe
  const loadGroupLeaderboard = useCallback(async (groupId) => {
    if (!userId) {
      logWarn('[useStudyGroups] loadGroupLeaderboard called without userId');
      return [];
    }

    log('[useStudyGroups] Loading leaderboard for group:', groupId);
    setIsLoading(true);
    try {
      // Récupérer les membres du groupe
      log('[useStudyGroups] Fetching group members for leaderboard...');
      const { data: members, error: membersError } = await supabase
        .from('study_group_members')
        .select('user_id, role')
        .eq('group_id', groupId);

      if (membersError) {
        logError('[useStudyGroups] Error fetching members for leaderboard:', membersError);
        throw new Error(`Impossible de charger les membres: ${membersError?.message || 'Erreur inconnue'}`);
      }

      log('[useStudyGroups] Found', members?.length || 0, 'members');
      const userIds = members.map(m => m.user_id);

      if (userIds.length === 0) {
        log('[useStudyGroups] No members found, returning empty leaderboard');
        return [];
      }

      // Récupérer les profils de gamification
      log('[useStudyGroups] Fetching gamification profiles for', userIds.length, 'users');
      const { data: profiles, error: profilesError } = await supabase
        .from('user_gamification')
        .select('*')
        .in('user_id', userIds);

      if (profilesError) {
        logError('[useStudyGroups] Error fetching gamification profiles:', profilesError);
        // Don't throw - return empty leaderboard instead
        logWarn('[useStudyGroups] Returning empty leaderboard due to error');
        return [];
      }

      log('[useStudyGroups] Found', profiles?.length || 0, 'gamification profiles');

      // Combiner les données
      const leaderboard = (profiles || [])
        .map(profile => {
          const member = members.find(m => m.user_id === profile.user_id);
          return {
            ...profile,
            role: member?.role || 'member'
          };
        })
        .sort((a, b) => {
          // Trier par XP total, puis par streak
          if (b.total_xp !== a.total_xp) {
            return b.total_xp - a.total_xp;
          }
          return b.current_streak - a.current_streak;
        });

      log('[useStudyGroups] Leaderboard assembled with', leaderboard.length, 'entries');
      return leaderboard;
    } catch (error) {
      logError('[useStudyGroups] Fatal error loading group leaderboard:', error);
      logWarn('[useStudyGroups] Leaderboard could not be loaded - returning empty array');
      // Return empty array instead of throwing to avoid blocking the UI
      return [];
    } finally {
      setIsLoading(false);
      log('[useStudyGroups] loadGroupLeaderboard completed');
    }
  }, [userId]);

  // Partager des decks au groupe
  const shareDecksToGroup = useCallback(async (groupId, deckIds) => {
    if (!userId) throw new Error('User not authenticated');

    setIsLoading(true);
    try {
      // Vérifier que l'utilisateur est membre du groupe
      const { data: membership } = await supabase
        .from('study_group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single();

      if (!membership) {
        throw new Error('Vous devez être membre du groupe pour partager des decks');
      }

      // Vérifier quels decks sont déjà partagés en une seule requête
      const { data: existingShares } = await supabase
        .from('study_group_shared_decks')
        .select('course_id')
        .eq('group_id', groupId)
        .in('course_id', deckIds);

      const existingDeckIds = new Set((existingShares || []).map(s => s.course_id));
      const newDeckIds = deckIds.filter(id => !existingDeckIds.has(id));

      if (newDeckIds.length === 0) {
        // Tous les decks sont déjà partagés
        return;
      }

      // Préparer les données pour l'insertion en batch
      const sharesToInsert = newDeckIds.map(deckId => ({
        group_id: groupId,
        course_id: deckId,
        shared_by: userId
      }));

      // Insérer tous les partages en une seule requête
      const { error: shareError } = await supabase
        .from('study_group_shared_decks')
        .insert(sharesToInsert);

      if (shareError) throw shareError;

      // Enregistrer les activités en batch
      const activitiesToInsert = newDeckIds.map(deckId => ({
        group_id: groupId,
        user_id: userId,
        activity_type: 'share_deck',
        activity_data: { course_id: deckId }
      }));

      await supabase
        .from('study_group_activities')
        .insert(activitiesToInsert);

      // Recharger les détails du groupe si c'est le groupe actuel
      if (currentGroup?.id === groupId) {
        await loadGroupDetails(groupId);
      }
    } catch (error) {
      logError('Error sharing decks:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userId, currentGroup, loadGroupDetails]);

  // Charger les données au montage
  useEffect(() => {
    if (userId) {
      logger.log('useEffect triggered - loading groups data');
      loadMyGroups();
      loadAvailableGroups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // Only re-run when userId changes to avoid infinite loops

  return {
    // États
    myGroups,
    availableGroups,
    currentGroup,
    isLoading,

    // Fonctions
    loadMyGroups,
    loadAvailableGroups,
    createGroup,
    joinGroup,
    joinByCode,
    leaveGroup,
    deleteGroup,
    inviteMember,
    generateInviteCode,
    loadGroupDetails,
    loadGroupLeaderboard,
    shareDecksToGroup
  };
}
