import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - ConvoCore',
  description: 'Privacy Policy for ConvoCore AI Chat Assistant',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-lg text-gray-600">ConvoCore AI Chat Assistant</p>
          <p className="text-sm text-gray-500 mt-2">Last updated: December 2024</p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              Welcome to ConvoCore. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI chat assistant application.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            <h3 className="text-xl font-medium text-gray-800 mb-3">Personal Information</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Email address (for account creation)</li>
              <li>Username or display name</li>
              <li>Profile information you provide</li>
            </ul>
            
            <h3 className="text-xl font-medium text-gray-800 mb-3">Usage Information</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Chat conversations and messages</li>
              <li>Voice recordings (when using voice features)</li>
              <li>App usage patterns and preferences</li>
              <li>Device information and performance data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-gray-700">
              <li>Provide and maintain the ConvoCore service</li>
              <li>Process your conversations and generate AI responses</li>
              <li>Improve our AI models and service quality</li>
              <li>Send you important updates and notifications</li>
              <li>Process payments and manage subscriptions</li>
              <li>Provide customer support</li>
              <li>Ensure app security and prevent fraud</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
            <p className="text-gray-700 mb-4">We implement industry-standard security measures:</p>
            <ul className="list-disc pl-6 text-gray-700">
              <li>End-to-end encryption for sensitive data</li>
              <li>Secure data transmission using HTTPS</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Your Rights</h2>
            <p className="text-gray-700 mb-4">You have the following rights:</p>
            <ul className="list-disc pl-6 text-gray-700">
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your data</li>
              <li>Export your data</li>
              <li>Object to certain processing activities</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Contact Us</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> privacy@convocore.app<br />
                <strong>Data Protection Officer:</strong> dpo@convocore.app
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
} 