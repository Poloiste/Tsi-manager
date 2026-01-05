import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './GroupDetail.css';

/**
 * GroupDetail Component
 * 
 * Displays group details and provides improved group invitation link functionality.
 * Features:
 * - Generate shareable invitation links
 * - Copy invitation links to clipboard
 * - Manage invitation link expiration
 * - Track invitation link usage
 */
const GroupDetail = () => {
  const { groupId } = useParams();
  const [groupData, setGroupData] = useState(null);
  const [invitationLinks, setInvitationLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newLinkConfig, setNewLinkConfig] = useState({
    expiresIn: 7, // days
    maxUses: null, // unlimited if null
  });
  const [copyFeedback, setCopyFeedback] = useState({});

  // Fetch group details and existing invitation links
  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        setLoading(true);
        // Replace with actual API endpoint
        const groupResponse = await fetch(`/api/groups/${groupId}`);
        if (!groupResponse.ok) throw new Error('Failed to fetch group details');
        
        const group = await groupResponse.json();
        setGroupData(group);

        // Fetch existing invitation links
        const linksResponse = await fetch(`/api/groups/${groupId}/invitation-links`);
        if (linksResponse.ok) {
          const links = await linksResponse.json();
          setInvitationLinks(links);
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching group details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      fetchGroupDetails();
    }
  }, [groupId]);

  /**
   * Generate a new invitation link
   */
  const handleGenerateInvitationLink = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/invitation-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expiresInDays: newLinkConfig.expiresIn,
          maxUses: newLinkConfig.maxUses,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate invitation link');

      const newLink = await response.json();
      setInvitationLinks([...invitationLinks, newLink]);
      setCopyFeedback({});
      
      // Show success feedback
      alert('Invitation link generated successfully!');
    } catch (err) {
      console.error('Error generating invitation link:', err);
      alert('Failed to generate invitation link. Please try again.');
    }
  };

  /**
   * Copy invitation link to clipboard
   */
  const handleCopyLink = async (linkId, linkUrl) => {
    try {
      await navigator.clipboard.writeText(linkUrl);
      
      // Show feedback
      setCopyFeedback({ ...copyFeedback, [linkId]: true });
      
      // Clear feedback after 2 seconds
      setTimeout(() => {
        setCopyFeedback({ ...copyFeedback, [linkId]: false });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      alert('Failed to copy link to clipboard');
    }
  };

  /**
   * Revoke an invitation link
   */
  const handleRevokeLink = async (linkId) => {
    if (!window.confirm('Are you sure you want to revoke this invitation link?')) {
      return;
    }

    try {
      const response = await fetch(`/api/groups/${groupId}/invitation-links/${linkId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to revoke invitation link');

      setInvitationLinks(invitationLinks.filter(link => link.id !== linkId));
      alert('Invitation link revoked successfully!');
    } catch (err) {
      console.error('Error revoking invitation link:', err);
      alert('Failed to revoke invitation link. Please try again.');
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  /**
   * Check if invitation link is expired
   */
  const isLinkExpired = (expiresAt) => {
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return <div className="group-detail-loading">Loading group details...</div>;
  }

  if (error) {
    return <div className="group-detail-error">Error: {error}</div>;
  }

  if (!groupData) {
    return <div className="group-detail-error">Group not found</div>;
  }

  return (
    <div className="group-detail-container">
      {/* Group Header */}
      <div className="group-header">
        <h1>{groupData.name}</h1>
        {groupData.description && (
          <p className="group-description">{groupData.description}</p>
        )}
      </div>

      {/* Group Information */}
      <div className="group-info">
        <div className="info-item">
          <span className="info-label">Members:</span>
          <span className="info-value">{groupData.memberCount || 0}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Created:</span>
          <span className="info-value">{formatDate(groupData.createdAt)}</span>
        </div>
      </div>

      {/* Invitation Links Section */}
      <div className="invitation-section">
        <h2>Group Invitation Links</h2>
        
        {/* Generate New Link */}
        <div className="generate-link-form">
          <h3>Generate New Invitation Link</h3>
          
          <div className="form-group">
            <label htmlFor="expiresIn">Link Expiration (days):</label>
            <select
              id="expiresIn"
              value={newLinkConfig.expiresIn}
              onChange={(e) => setNewLinkConfig({
                ...newLinkConfig,
                expiresIn: parseInt(e.target.value),
              })}
            >
              <option value={1}>1 day</option>
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={365}>1 year</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="maxUses">Max Uses (leave empty for unlimited):</label>
            <input
              id="maxUses"
              type="number"
              min="1"
              value={newLinkConfig.maxUses || ''}
              onChange={(e) => setNewLinkConfig({
                ...newLinkConfig,
                maxUses: e.target.value ? parseInt(e.target.value) : null,
              })}
              placeholder="Unlimited"
            />
          </div>

          <button 
            className="btn btn-primary"
            onClick={handleGenerateInvitationLink}
          >
            Generate Invitation Link
          </button>
        </div>

        {/* Existing Invitation Links */}
        <div className="invitation-links-list">
          <h3>Active Invitation Links</h3>
          
          {invitationLinks.length === 0 ? (
            <p className="empty-state">No invitation links generated yet.</p>
          ) : (
            <table className="links-table">
              <thead>
                <tr>
                  <th>Link</th>
                  <th>Expires</th>
                  <th>Uses</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invitationLinks.map((link) => {
                  const expired = isLinkExpired(link.expiresAt);
                  const usageInfo = link.maxUses 
                    ? `${link.uses || 0}/${link.maxUses}`
                    : `${link.uses || 0}/∞`;

                  return (
                    <tr key={link.id} className={expired ? 'expired' : ''}>
                      <td className="link-cell">
                        <code>{link.code || link.id}</code>
                      </td>
                      <td>{formatDate(link.expiresAt)}</td>
                      <td>{usageInfo}</td>
                      <td>
                        <span className={`status-badge ${expired ? 'expired' : 'active'}`}>
                          {expired ? 'Expired' : 'Active'}
                        </span>
                      </td>
                      <td className="actions-cell">
                        {!expired && (
                          <button
                            className="btn btn-small btn-copy"
                            onClick={() => handleCopyLink(link.id, link.invitationUrl)}
                            title="Copy invitation link"
                          >
                            {copyFeedback[link.id] ? '✓ Copied' : 'Copy'}
                          </button>
                        )}
                        <button
                          className="btn btn-small btn-danger"
                          onClick={() => handleRevokeLink(link.id)}
                          title="Revoke this invitation link"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupDetail;
