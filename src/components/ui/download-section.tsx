"use client";

import { motion } from "framer-motion";
import { Download, Smartphone, Monitor, ExternalLink, CheckCircle } from "lucide-react";
import { useState } from "react";

export function DownloadSection() {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (type: 'android' | 'desktop') => {
    setIsDownloading(true);
    
    try {
      if (type === 'android') {
        // For Android, redirect to Play Store or download APK
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
          // On mobile, try to open Play Store
          window.open('https://play.google.com/store/apps/details?id=com.convocore.app', '_blank');
        } else {
          // On desktop, show message that APK is being prepared
          alert('Android APK is being prepared. Please check back soon or visit the Google Play Store.');
          // Fallback to Play Store
          window.open('https://play.google.com/store/apps/details?id=com.convocore.app', '_blank');
        }
      } else {
        // For desktop, download the web app or PWA
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          // PWA is available, show install prompt
          const installEvent = new Event('beforeinstallprompt');
          window.dispatchEvent(installEvent);
        } else {
          // Fallback to web app
          window.open('https://convocore.site', '_blank');
        }
      }
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Download ConvoCore
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Get ConvoCore on your preferred platform. Available for Android and web browsers.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Android Download */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Smartphone className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Android App
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Download the native Android app for the best experience with push notifications and offline support.
              </p>
              
              <div className="space-y-3 mb-6 text-left">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Native performance</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Push notifications</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Offline support</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Voice features</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleDownload('android')}
                  disabled={isDownloading}
                  className="w-full group relative px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Downloading...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Download className="w-5 h-5" />
                      Get Android App
                    </span>
                  )}
                </button>
                
                <a
                  href="https://play.google.com/store/apps/details?id=com.convocore.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-6 py-2 text-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  <span className="flex items-center justify-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    View on Google Play
                  </span>
                </a>
              </div>
            </div>
          </motion.div>

          {/* Desktop/Web Download */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Monitor className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Web App
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Use ConvoCore in your browser or install it as a Progressive Web App for desktop-like experience.
              </p>
              
              <div className="space-y-3 mb-6 text-left">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">No installation required</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Cross-platform</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Automatic updates</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">PWA support</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleDownload('desktop')}
                  disabled={isDownloading}
                  className="w-full group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Opening...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <ExternalLink className="w-5 h-5" />
                      Open Web App
                    </span>
                  )}
                </button>
                
                <a
                  href="https://convocore.site"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-6 py-2 text-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  <span className="flex items-center justify-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Visit Website
                  </span>
                </a>
              </div>
            </div>
          </motion.div>
        </div>

        {/* System Requirements */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-12 text-center"
        >
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            System Requirements
          </h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto text-sm text-gray-600 dark:text-gray-300">
            <div>
              <strong className="text-gray-900 dark:text-white">Android:</strong> Android 6.0 (API 23) or higher
            </div>
            <div>
              <strong className="text-gray-900 dark:text-white">Browser:</strong> Chrome, Firefox, Safari, Edge (latest)
            </div>
            <div>
              <strong className="text-gray-900 dark:text-white">Storage:</strong> 50MB free space recommended
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}