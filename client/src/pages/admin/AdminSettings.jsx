import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Shield, 
  Database, 
  Mail, 
  Bell,
  Globe,
  Lock
} from 'lucide-react';

const AdminSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [settings, setSettings] = useState({
    siteName: 'UrbanSprout',
    siteDescription: 'Your ultimate plant care companion',
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
    pushNotifications: true,
    maxFileSize: '5MB',
    sessionTimeout: '24',
    backupFrequency: 'daily'
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Settings saved successfully');
    } catch (error) {
      setMessage('Error saving settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const settingSections = [
    {
      title: 'General Settings',
      icon: Globe,
      settings: [
        {
          key: 'siteName',
          label: 'Site Name',
          type: 'text',
          description: 'The name of your website'
        },
        {
          key: 'siteDescription',
          label: 'Site Description',
          type: 'textarea',
          description: 'A brief description of your website'
        },
        {
          key: 'maintenanceMode',
          label: 'Maintenance Mode',
          type: 'checkbox',
          description: 'Enable maintenance mode to temporarily disable the site'
        }
      ]
    },
    {
      title: 'User Management',
      icon: Shield,
      settings: [
        {
          key: 'registrationEnabled',
          label: 'Allow Registration',
          type: 'checkbox',
          description: 'Allow new users to register'
        },
        {
          key: 'sessionTimeout',
          label: 'Session Timeout (hours)',
          type: 'number',
          description: 'How long users stay logged in'
        }
      ]
    },
    {
      title: 'Notifications',
      icon: Bell,
      settings: [
        {
          key: 'emailNotifications',
          label: 'Email Notifications',
          type: 'checkbox',
          description: 'Send email notifications to users'
        },
        {
          key: 'pushNotifications',
          label: 'Push Notifications',
          type: 'checkbox',
          description: 'Enable push notifications'
        }
      ]
    },
    {
      title: 'System Settings',
      icon: Database,
      settings: [
        {
          key: 'maxFileSize',
          label: 'Max File Upload Size',
          type: 'select',
          description: 'Maximum size for file uploads',
          options: ['1MB', '5MB', '10MB', '25MB']
        },
        {
          key: 'backupFrequency',
          label: 'Backup Frequency',
          type: 'select',
          description: 'How often to backup the database',
          options: ['daily', 'weekly', 'monthly']
        }
      ]
    }
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 text-sm">Manage system settings and preferences</p>
            </div>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-4">
        {/* Message */}
        {message && (
          <div className={`mb-6 p-3 rounded-lg text-sm text-center ${
            message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* Settings Sections */}
        <div className="space-y-8">
          {settingSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <section.icon className="h-5 w-5 text-gray-400 mr-3" />
                  <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
                </div>
              </div>
              <div className="px-6 py-6">
                <div className="space-y-6">
                  {section.settings.map((setting, settingIndex) => (
                    <div key={settingIndex} className="flex items-start justify-between">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {setting.label}
                        </label>
                        <p className="text-sm text-gray-500 mb-3">{setting.description}</p>
                      </div>
                      <div className="ml-6">
                        {setting.type === 'text' && (
                          <input
                            type="text"
                            value={settings[setting.key]}
                            onChange={(e) => handleInputChange(setting.key, e.target.value)}
                            className="w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        )}
                        {setting.type === 'textarea' && (
                          <textarea
                            rows={3}
                            value={settings[setting.key]}
                            onChange={(e) => handleInputChange(setting.key, e.target.value)}
                            className="w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        )}
                        {setting.type === 'number' && (
                          <input
                            type="number"
                            value={settings[setting.key]}
                            onChange={(e) => handleInputChange(setting.key, e.target.value)}
                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        )}
                        {setting.type === 'checkbox' && (
                          <input
                            type="checkbox"
                            checked={settings[setting.key]}
                            onChange={(e) => handleInputChange(setting.key, e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        )}
                        {setting.type === 'select' && (
                          <select
                            value={settings[setting.key]}
                            onChange={(e) => handleInputChange(setting.key, e.target.value)}
                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {setting.options.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* System Information */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Database className="h-5 w-5 text-gray-400 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">System Information</h2>
            </div>
          </div>
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">v1.0.0</div>
                <div className="text-sm text-gray-500">Application Version</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">Online</div>
                <div className="text-sm text-gray-500">System Status</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">67%</div>
                <div className="text-sm text-gray-500">Storage Used</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;



