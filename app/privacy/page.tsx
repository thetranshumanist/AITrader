import Link from "next/link";
import { TrendingUp, ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">AI Trader</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600">Last updated: December 29, 2024</p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              AI Trader ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our automated trading platform and related services (the "Service").
            </p>
            <p className="text-gray-700">
              By using our Service, you agree to the collection and use of information in accordance with this Privacy Policy. This policy applies to all users of our platform, including visitors, registered users, and premium subscribers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">2.1 Personal Information</h3>
            <p className="text-gray-700 mb-4">We collect the following personal information:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Name and contact information (email address, phone number)</li>
              <li>Account credentials (username, encrypted passwords)</li>
              <li>Identity verification documents (government ID, address verification)</li>
              <li>Financial information (bank account details, brokerage account information)</li>
              <li>Tax identification numbers (for reporting compliance)</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mb-3">2.2 Trading and Financial Data</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Trading history and transaction records</li>
              <li>Portfolio positions and performance data</li>
              <li>Investment preferences and risk tolerance</li>
              <li>API keys and credentials for connected brokerage accounts</li>
              <li>Payment and billing information</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mb-3">2.3 Technical Information</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>IP addresses and device identifiers</li>
              <li>Browser type and version</li>
              <li>Operating system and device information</li>
              <li>Usage patterns and platform interactions</li>
              <li>Log files and error reports</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">We use the collected information for the following purposes:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>Service Provision:</strong> To provide and maintain our trading platform, execute trades, and manage your portfolio</li>
              <li><strong>Identity Verification:</strong> To verify your identity and comply with Know Your Customer (KYC) and Anti-Money Laundering (AML) regulations</li>
              <li><strong>Security:</strong> To protect against fraud, unauthorized access, and other security threats</li>
              <li><strong>Communication:</strong> To send you important updates, trading alerts, and customer support responses</li>
              <li><strong>Compliance:</strong> To meet regulatory requirements and tax reporting obligations</li>
              <li><strong>Platform Improvement:</strong> To analyze usage patterns and improve our algorithms and user experience</li>
              <li><strong>Marketing:</strong> To send promotional content and feature updates (with your consent)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Sharing and Disclosure</h2>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">4.1 Third-Party Service Providers</h3>
            <p className="text-gray-700 mb-4">We may share your information with trusted third parties:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>Brokerage Partners:</strong> Alpaca Markets and other licensed brokers for trade execution</li>
              <li><strong>Data Providers:</strong> Market data vendors for real-time pricing and analytics</li>
              <li><strong>Cloud Services:</strong> Supabase, Vercel, and other infrastructure providers</li>
              <li><strong>Payment Processors:</strong> For billing and subscription management</li>
              <li><strong>Compliance Services:</strong> For identity verification and regulatory compliance</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mb-3">4.2 Legal Requirements</h3>
            <p className="text-gray-700 mb-4">We may disclose your information when required by law or regulation:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>To comply with legal process, court orders, or government requests</li>
              <li>For tax reporting to relevant authorities</li>
              <li>To investigate potential fraud or security breaches</li>
              <li>To protect our rights, property, or safety, or that of our users</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-gray-700 mb-4">We implement industry-standard security measures to protect your information:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>Encryption:</strong> All data is encrypted in transit using TLS/SSL and at rest using AES-256</li>
              <li><strong>Access Controls:</strong> Strict role-based access controls and multi-factor authentication</li>
              <li><strong>Monitoring:</strong> 24/7 security monitoring and intrusion detection systems</li>
              <li><strong>Compliance:</strong> SOC 2 Type II compliance and regular security audits</li>
              <li><strong>API Security:</strong> Secure API key management and OAuth 2.0 authentication</li>
            </ul>
            <p className="text-gray-700">
              While we strive to protect your information, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security but continuously work to improve our security measures.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
            <p className="text-gray-700 mb-4">We retain your information for the following periods:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>Account Information:</strong> For the duration of your account plus 7 years (regulatory requirement)</li>
              <li><strong>Trading Records:</strong> 7 years from the date of transaction (regulatory requirement)</li>
              <li><strong>Communications:</strong> 3 years from the date of communication</li>
              <li><strong>Technical Logs:</strong> 90 days for security and troubleshooting purposes</li>
              <li><strong>Marketing Data:</strong> Until you opt out or request deletion</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights and Choices</h2>
            <p className="text-gray-700 mb-4">You have the following rights regarding your personal information:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>Access:</strong> Request access to your personal information</li>
              <li><strong>Correction:</strong> Request correction of inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your information (subject to regulatory requirements)</li>
              <li><strong>Portability:</strong> Request a copy of your data in a machine-readable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Restrict Processing:</strong> Request limitation of how we process your information</li>
            </ul>
            <p className="text-gray-700">
              To exercise these rights, please contact us at privacy@aitrader.com. We will respond to your request within 30 days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies and Tracking Technologies</h2>
            <p className="text-gray-700 mb-4">We use cookies and similar technologies to:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Maintain your session and keep you logged in</li>
              <li>Remember your preferences and settings</li>
              <li>Analyze platform usage and performance</li>
              <li>Provide personalized content and recommendations</li>
              <li>Detect and prevent fraud and security threats</li>
            </ul>
            <p className="text-gray-700">
              You can control cookie settings through your browser preferences. However, disabling certain cookies may affect platform functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. International Data Transfers</h2>
            <p className="text-gray-700 mb-4">
              Your information may be processed and stored in countries other than your own. We ensure adequate protection through:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Standard Contractual Clauses (SCCs) with international partners</li>
              <li>Adequacy decisions recognized by data protection authorities</li>
              <li>Certification under recognized privacy frameworks</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Children's Privacy</h2>
            <p className="text-gray-700">
              Our Service is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If you become aware that a child has provided us with personal information, please contact us, and we will take steps to delete such information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Privacy Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Continued use of our Service after changes become effective constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-2"><strong>Email:</strong> privacy@aitrader.com</p>
              <p className="text-gray-700 mb-2"><strong>Address:</strong> AI Trader Privacy Office</p>
              <p className="text-gray-700 mb-2">123 Financial District</p>
              <p className="text-gray-700 mb-2">New York, NY 10004</p>
              <p className="text-gray-700"><strong>Phone:</strong> +1 (555) 123-4567</p>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">AI Trader</span>
            </div>
            <p className="text-gray-400">&copy; 2024 AI Trader. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}