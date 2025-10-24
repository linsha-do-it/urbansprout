const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Database Backup Script for UrbanSprout
 * Creates timestamped backups of your MongoDB database
 */

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                  new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0];

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function backupDatabase() {
  try {
    console.log('🔄 Starting database backup...');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    const backupPath = path.join(BACKUP_DIR, `urbansprout_backup_${TIMESTAMP}`);
    
    // Create backup command
    const command = `mongodump --uri="${process.env.MONGODB_URI}" --out="${backupPath}"`;
    
    console.log(`📦 Creating backup at: ${backupPath}`);
    console.log(`🔗 Using URI: ${process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Backup failed:', error.message);
        return;
      }
      
      if (stderr) {
        console.warn('⚠️ Backup warnings:', stderr);
      }
      
      console.log('✅ Database backup completed successfully!');
      console.log(`📁 Backup location: ${backupPath}`);
      console.log(`📊 Backup size: ${getDirectorySize(backupPath)}`);
      
      // Create backup info file
      const backupInfo = {
        timestamp: new Date().toISOString(),
        backupPath: backupPath,
        databaseUri: process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@'),
        size: getDirectorySize(backupPath)
      };
      
      fs.writeFileSync(
        path.join(backupPath, 'backup_info.json'), 
        JSON.stringify(backupInfo, null, 2)
      );
      
      console.log('📋 Backup info saved to backup_info.json');
    });
    
  } catch (error) {
    console.error('❌ Backup script error:', error.message);
    process.exit(1);
  }
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

// List existing backups
function listBackups() {
  console.log('\n📋 Existing backups:');
  
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

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--list') || args.includes('-l')) {
    listBackups();
  } else {
    backupDatabase();
  }
}

module.exports = { backupDatabase, listBackups };




