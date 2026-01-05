import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  FileCopy as FileCopyIcon,
  Close as CloseIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../contexts/GroupContext';
import MemberManagement from './MemberManagement';

const GroupDetail = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getGroupById, updateGroup, deleteGroup } = useGroup();

  const [group, setGroup] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [invitationLinkOpen, setInvitationLinkOpen] = useState(false);
  const [invitationLink, setInvitationLink] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // Load group data
  useEffect(() => {
    const loadGroup = async () => {
      try {
        setLoading(true);
        const groupData = await getGroupById(groupId);
        setGroup(groupData);
        setEditData(groupData);
      } catch (err) {
        setError('Failed to load group details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadGroup();
  }, [groupId, getGroupById]);

  // Generate invitation link for private groups
  const generateInvitationLink = () => {
    if (group && group.isPrivate) {
      const token = btoa(`${group.id}-${Date.now()}`);
      const link = `${window.location.origin}/groups/invite/${token}`;
      setInvitationLink(link);
      setInvitationLinkOpen(true);
    }
  };

  // Copy invitation link to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(invitationLink);
      setCopySuccess(true);
      setSnackbarMessage('Invitation link copied to clipboard!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // Reset copy success after 2 seconds
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      setSnackbarMessage('Failed to copy link to clipboard');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      console.error('Failed to copy:', err);
    }
  };

  // Handle edit mode
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setEditData(group);
    }
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    try {
      await updateGroup(groupId, editData);
      setGroup(editData);
      setIsEditing(false);
      setSnackbarMessage('Group updated successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMessage('Failed to update group');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      console.error(err);
    }
  };

  // Handle delete group
  const handleDeleteGroup = async () => {
    try {
      await deleteGroup(groupId);
      setSnackbarMessage('Group deleted successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setTimeout(() => navigate('/groups'), 1500);
    } catch (err) {
      setSnackbarMessage('Failed to delete group');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      console.error(err);
    }
    setDeleteConfirmOpen(false);
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setEditData({
      ...editData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography>Loading group details...</Typography>
      </Container>
    );
  }

  if (!group) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Group not found</Alert>
      </Container>
    );
  }

  const isGroupOwner = user && group.ownerId === user.id;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Group Header Card */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            {isEditing ? (
              <TextField
                fullWidth
                label="Group Name"
                name="name"
                value={editData.name || ''}
                onChange={handleInputChange}
                margin="normal"
                variant="outlined"
              />
            ) : (
              <Typography variant="h4" gutterBottom>
                {group.name}
              </Typography>
            )}

            {isEditing ? (
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={editData.description || ''}
                onChange={handleInputChange}
                margin="normal"
                multiline
                rows={3}
                variant="outlined"
              />
            ) : (
              <Typography variant="body1" color="textSecondary" paragraph>
                {group.description || 'No description'}
              </Typography>
            )}

            {/* Group Status Chips */}
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Chip
                label={group.isPrivate ? 'Private' : 'Public'}
                color={group.isPrivate ? 'secondary' : 'primary'}
                variant="outlined"
              />
              <Chip
                label={`${group.memberCount || 0} Members`}
                variant="outlined"
              />
            </Box>
          </Box>

          {/* Action Buttons */}
          {isGroupOwner && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {!isEditing && group.isPrivate && (
                <Tooltip title="Generate invitation link for private group">
                  <Button
                    variant="outlined"
                    color="info"
                    startIcon={<FileCopyIcon />}
                    onClick={generateInvitationLink}
                  >
                    Invite
                  </Button>
                </Tooltip>
              )}
              <Button
                variant="outlined"
                color="primary"
                startIcon={<EditIcon />}
                onClick={handleEditToggle}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
              {isEditing && (
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleSaveChanges}
                >
                  Save Changes
                </Button>
              )}
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteConfirmOpen(true)}
              >
                Delete
              </Button>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Member Management Section */}
      <MemberManagement groupId={groupId} isGroupOwner={isGroupOwner} />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Delete Group</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this group? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteGroup}
            color="error"
            variant="contained"
          >
            Delete Group
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invitation Link Dialog */}
      <Dialog
        open={invitationLinkOpen}
        onClose={() => setInvitationLinkOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Invitation Link
          <IconButton
            onClick={() => setInvitationLinkOpen(false)}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Share this link with others to invite them to join the private group "{group.name}":
          </Typography>
          <Box sx={{ mt: 2, mb: 2 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: 'action.hover',
              }}
            >
              <TextField
                fullWidth
                value={invitationLink}
                readOnly
                size="small"
                sx={{ mr: 1 }}
                variant="standard"
              />
              <Tooltip title={copySuccess ? 'Copied!' : 'Copy to clipboard'}>
                <IconButton
                  onClick={copyToClipboard}
                  color={copySuccess ? 'success' : 'primary'}
                  size="small"
                >
                  {copySuccess ? <CheckIcon /> : <FileCopyIcon />}
                </IconButton>
              </Tooltip>
            </Paper>
          </Box>
          <Alert severity="info">
            This link can be shared with anyone to invite them to join the group. Recipients will need to sign in to accept the invitation.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvitationLinkOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default GroupDetail;