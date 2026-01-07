/**
 * Test script for the Category and Channel System
 * 
 * This script tests the new API endpoints for creating categories,
 * channels, and managing memberships.
 * 
 * Usage: node backend/test-category-channel-system.js
 */

require('dotenv').config();
const supabase = require('./config/supabase');

// Test user ID (replace with actual user ID from your system)
const TEST_USER_ID = process.env.TEST_USER_ID || '00000000-0000-0000-0000-000000000000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Test 1: Create a category
async function testCreateCategory() {
  logInfo('Test 1: Creating a category...');
  
  try {
    const { data, error } = await supabase
      .from('chat_channels')
      .insert([{
        name: 'Test Category',
        channel_type: 'category',
        visibility: 'public',
        created_by: TEST_USER_ID,
        group_id: null,
        parent_id: null
      }])
      .select()
      .single();

    if (error) {
      logError(`Failed to create category: ${error.message}`);
      return null;
    }

    logSuccess(`Category created: ${data.name} (ID: ${data.id})`);
    return data;
  } catch (error) {
    logError(`Exception: ${error.message}`);
    return null;
  }
}

// Test 2: Create a text channel under a category
async function testCreateTextChannel(categoryId) {
  logInfo('Test 2: Creating a text channel under category...');
  
  try {
    const { data, error } = await supabase
      .from('chat_channels')
      .insert([{
        name: 'General Chat',
        channel_type: 'text',
        visibility: 'public',
        created_by: TEST_USER_ID,
        group_id: null,
        parent_id: categoryId
      }])
      .select()
      .single();

    if (error) {
      logError(`Failed to create text channel: ${error.message}`);
      return null;
    }

    logSuccess(`Text channel created: ${data.name} (ID: ${data.id})`);
    return data;
  } catch (error) {
    logError(`Exception: ${error.message}`);
    return null;
  }
}

// Test 3: Create a private voice channel
async function testCreatePrivateVoiceChannel(categoryId) {
  logInfo('Test 3: Creating a private voice channel...');
  
  try {
    const { data, error } = await supabase
      .from('chat_channels')
      .insert([{
        name: 'Private Voice',
        channel_type: 'voice',
        visibility: 'private',
        created_by: TEST_USER_ID,
        group_id: null,
        parent_id: categoryId
      }])
      .select()
      .single();

    if (error) {
      logError(`Failed to create voice channel: ${error.message}`);
      return null;
    }

    logSuccess(`Private voice channel created: ${data.name} (ID: ${data.id})`);
    return data;
  } catch (error) {
    logError(`Exception: ${error.message}`);
    return null;
  }
}

// Test 4: Verify channel membership was auto-created for private channel
async function testVerifyAutoMembership(channelId) {
  logInfo('Test 4: Verifying auto-membership for private channel...');
  
  try {
    const { data, error } = await supabase
      .from('channel_memberships')
      .select('*')
      .eq('channel_id', channelId)
      .eq('user_id', TEST_USER_ID);

    if (error) {
      logError(`Failed to verify membership: ${error.message}`);
      return false;
    }

    if (data && data.length > 0) {
      logSuccess(`Auto-membership verified: Role = ${data[0].role}`);
      return true;
    } else {
      logWarning('No auto-membership found');
      return false;
    }
  } catch (error) {
    logError(`Exception: ${error.message}`);
    return false;
  }
}

// Test 5: Add a member to private channel
async function testAddMembership(channelId, userId, role = 'member') {
  logInfo(`Test 5: Adding membership (role: ${role}) to channel...`);
  
  try {
    const { data, error } = await supabase
      .from('channel_memberships')
      .insert([{
        channel_id: channelId,
        user_id: userId,
        role: role
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        logWarning('User is already a member of this channel');
        return null;
      }
      logError(`Failed to add membership: ${error.message}`);
      return null;
    }

    logSuccess(`Membership added: User ${userId} as ${role}`);
    return data;
  } catch (error) {
    logError(`Exception: ${error.message}`);
    return null;
  }
}

// Test 6: List all channels with hierarchy
async function testListChannels() {
  logInfo('Test 6: Listing all channels with hierarchy...');
  
  try {
    // Get categories
    const { data: categories, error: catError } = await supabase
      .from('chat_channels')
      .select('*')
      .eq('channel_type', 'category')
      .is('group_id', null)
      .order('position')
      .order('created_at');

    if (catError) {
      logError(`Failed to fetch categories: ${catError.message}`);
      return;
    }

    logSuccess(`Found ${categories.length} categories`);

    // For each category, get its children
    for (const category of categories) {
      log(`\n  📁 ${category.name} (${category.visibility})`, 'blue');
      
      const { data: children, error: childError } = await supabase
        .from('chat_channels')
        .select('*')
        .eq('parent_id', category.id)
        .order('position')
        .order('created_at');

      if (childError) {
        logError(`    Failed to fetch children: ${childError.message}`);
        continue;
      }

      if (children && children.length > 0) {
        for (const child of children) {
          const icon = child.channel_type === 'text' ? '💬' : '🔊';
          const lock = child.visibility === 'private' ? '🔒' : '🔓';
          log(`    ${icon} ${lock} ${child.name}`, 'reset');
        }
      } else {
        log('    (no channels)', 'yellow');
      }
    }

    // List orphan channels (no parent)
    const { data: orphans, error: orphanError } = await supabase
      .from('chat_channels')
      .select('*')
      .neq('channel_type', 'category')
      .is('parent_id', null)
      .is('group_id', null)
      .order('created_at');

    if (!orphanError && orphans && orphans.length > 0) {
      log('\n  📝 Orphan channels (no category):', 'yellow');
      for (const orphan of orphans) {
        const icon = orphan.channel_type === 'text' ? '💬' : '🔊';
        const lock = orphan.visibility === 'private' ? '🔒' : '🔓';
        log(`    ${icon} ${lock} ${orphan.name}`, 'reset');
      }
    }
  } catch (error) {
    logError(`Exception: ${error.message}`);
  }
}

// Test 7: Test invalid operations
async function testInvalidOperations() {
  logInfo('Test 7: Testing invalid operations...');
  
  // Try to create a category with parent_id
  try {
    const { data, error } = await supabase
      .from('chat_channels')
      .insert([{
        name: 'Invalid Category',
        channel_type: 'category',
        visibility: 'public',
        created_by: TEST_USER_ID,
        parent_id: '00000000-0000-0000-0000-000000000001' // Non-existent parent
      }])
      .select()
      .single();

    if (error) {
      logSuccess('Correctly rejected category with parent_id');
    } else {
      logWarning('Category with parent_id should have been rejected');
    }
  } catch (error) {
    logSuccess('Correctly rejected category with parent_id');
  }
}

// Test 8: Cleanup - Delete test data
async function testCleanup(categoryId) {
  logInfo('Test 8: Cleaning up test data...');
  
  try {
    // Delete children first (cascading should handle this, but being explicit)
    const { error: childError } = await supabase
      .from('chat_channels')
      .delete()
      .eq('parent_id', categoryId);

    if (childError) {
      logWarning(`Failed to delete children: ${childError.message}`);
    }

    // Delete category
    const { error: catError } = await supabase
      .from('chat_channels')
      .delete()
      .eq('id', categoryId);

    if (catError) {
      logError(`Failed to delete category: ${catError.message}`);
    } else {
      logSuccess('Test data cleaned up successfully');
    }
  } catch (error) {
    logError(`Exception during cleanup: ${error.message}`);
  }
}

// Main test runner
async function runTests() {
  log('\n========================================', 'blue');
  log('Category and Channel System Tests', 'blue');
  log('========================================\n', 'blue');

  if (TEST_USER_ID === '00000000-0000-0000-0000-000000000000') {
    logWarning('Using default test user ID. Set TEST_USER_ID in .env for better results.\n');
  }

  let category = null;
  let textChannel = null;
  let voiceChannel = null;

  try {
    // Run tests
    category = await testCreateCategory();
    if (!category) {
      logError('Cannot proceed without a category');
      return;
    }

    log(''); // Empty line for readability
    textChannel = await testCreateTextChannel(category.id);

    log('');
    voiceChannel = await testCreatePrivateVoiceChannel(category.id);

    if (voiceChannel) {
      log('');
      await testVerifyAutoMembership(voiceChannel.id);
    }

    log('');
    await testInvalidOperations();

    log('');
    await testListChannels();

    // Cleanup
    if (category) {
      log('');
      await testCleanup(category.id);
    }

    log('\n========================================', 'green');
    log('All tests completed!', 'green');
    log('========================================\n', 'green');

  } catch (error) {
    logError(`\nTest suite failed: ${error.message}`);
    
    // Attempt cleanup even on failure
    if (category) {
      log('');
      await testCleanup(category.id);
    }
  }
}

// Run the tests
runTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});
