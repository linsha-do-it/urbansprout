const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Database Restore Script for UrbanSprout
 * Restores MongoDB database from backup files
 */

const BACKUP_DIR = path.join(__dirname, '..', 'backups');

async function restoreDatabase(backupName) {
  try {
    console.log('🔄 Starting database restore...');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    if (!backupName) {
      console.error('❌ Please provide a backup name to restore from.');
      console.log('Usage: node restoreDatabase.js <backup-name>');
      console.log('Example: node restoreDatabase.js urbansprout_backup_2024-01-15_10-30-00');
      listBackups();
      return;
    }

    const backupPath = path.join(BACKUP_DIR, backupName);
    
    if (!fs.existsSync(backupPath)) {
      console.error(`❌ Backup not found: ${backupPath}`);
      console.log('Available backups:');
      listBackups();
      return;
    }

    // Check if backup contains database files
    const dbPath = path.join(backupPath, 'urbansprout');
    if (!fs.existsSync(dbPath)) {
      console.error(`❌ Invalid backup structure. Expected database folder at: ${dbPath}`);
      return;
    }

    console.log(`📦 Restoring from backup: ${backupName}`);
    console.log(`🔗 Target URI: ${process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`);
    
    // Create restore command
    const command = `mongorestore --uri="${process.env.MONGODB_URI}" --drop "${dbPath}"`;
    
    console.log('⚠️  WARNING: This will DROP and REPLACE your current database!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    
    // Give user time to cancel
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Restore failed:', error.message);
        return;
      }
      
      if (stderr) {
        console.warn('⚠️ Restore warnings:', stderr);
      }
      
      console.log('✅ Database restore completed successfully!');
      console.log(`📊 Restored from: ${backupName}`);
      
      // Display restore summary
      if (stdout) {
        console.log('\n📋 Restore Summary:');
        console.log(stdout);
      }
    });
    
  } catch (error) {
    console.error('❌ Restore script error:', error.message);
    process.exit(1);
  }
}

// List existing backups
function listBackups() {
  console.log('\n📋 Available backups:');
  
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('No backups found.');
    return;
  }
  
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(item => item.startsWith('urbansprout_backup_'))
    .sort()
    .reverse();
  
  if (backups.length === 0) {
    console.log('No backups found.');
    return;
  }
  
  backups.forEach((backup, index) => {
    const backupPath = path.join(BACKUP_DIR, backup);
    const size = getDirectorySize(backupPath);
    const date = backup.replace('urbansprout_backup_', '').replace(/_/g, ' ');
    console.log(`${index + 1}. ${backup} (${size}) - ${date}`);
  });
}

function getDirectorySize(dirPath) {
  try {
    const stats = fs.statSync(dirPath);
    if (stats.isFile()) {
      return formatBytes(stats.size);
    }
    
    let totalSize = 0;
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const fileStats = fs.statSync(filePath);
      if (fileStats.isFile()) {
        totalSize += fileStats.size;
      } else if (fileStats.isDirectory()) {
        totalSize += parseInt(getDirectorySize(filePath).replace(/[^\d]/g, '')) || 0;
      }
    });
    
    return formatBytes(totalSize);
  } catch (error) {
    return 'Unknown';
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Interactive restore function
async function interactiveRestore() {
  console.log('🔄 Interactive Database Restore');
  console.log('================================');
  
  listBackups();
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('\nEnter the backup name to restore (or "cancel" to exit): ', (answer) => {
    rl.close();
    
    if (answer.toLowerCase() === 'cancel') {
      console.log('❌ Restore cancelled.');
      return;
    }
    
    restoreDatabase(answer.trim());
  });
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--list') || args.includes('-l')) {
    listBackups();
  } else if (args.includes('--interactive') || args.includes('-i')) {
    interactiveRestore();
  } else if (args.length > 0) {
    restoreDatabase(args[0]);
  } else {
    console.log('Usage:');
    console.log('  node restoreDatabase.js <backup-name>     # Restore specific backup');
    console.log('  node restoreDatabase.js --list            # List available backups');
    console.log('  node restoreDatabase.js --interactive     # Interactive restore');
    console.log('');
    console.log('Examples:');
    console.log('  node restoreDatabase.js urbansprout_backup_2024-01-15_10-30-00');
    console.log('  node restoreDatabase.js --list');
    console.log('  node restoreDatabase.js -i');
  }
}

module.exports = { restoreDatabase, listBackups, interactiveRestore };




