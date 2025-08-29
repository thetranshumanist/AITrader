import Link from "next/link";
import { TrendingUp, ArrowLeft } from "lucide-react";

export default function CookiePolicyPage() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
          <p className="text-gray-600">Last updated: December 29, 2024</p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. What Are Cookies?</h2>
            <p className="text-gray-700 mb-4">
              Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit our website. They help us provide you with a better experience by remembering your preferences, keeping you logged in, and analyzing how you use our platform.
            </p>
            <p className="text-gray-700">
              This Cookie Policy explains how AI Trader ("we," "our," or "us") uses cookies and similar tracking technologies on our automated trading platform and website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Types of Cookies We Use</h2>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">2.1 Essential Cookies</h3>
            <p className="text-gray-700 mb-4">
              These cookies are necessary for the website to function and cannot be switched off in our systems. They are usually set in response to actions made by you which amount to a request for services.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Examples:</h4>
              <ul className="list-disc pl-6 text-gray-700">
                <li><strong>Session Management:</strong> Keeping you logged in during your visit</li>
                <li><strong>Security:</strong> Protecting against cross-site request forgery attacks</li>
                <li><strong>Load Balancing:</strong> Distributing traffic across our servers</li>
                <li><strong>Cookie Consent:</strong> Remembering your cookie preferences</li>
              </ul>
            </div>

            <h3 className="text-xl font-medium text-gray-900 mb-3">2.2 Functional Cookies</h3>
            <p className="text-gray-700 mb-4">
              These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third party providers whose services we have added to our pages.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Examples:</h4>
              <ul className="list-disc pl-6 text-gray-700">
                <li><strong>User Preferences:</strong> Remembering your dashboard layout and settings</li>
                <li><strong>Language Settings:</strong> Storing your preferred language</li>
                <li><strong>Trading Preferences:</strong> Saving your default trading parameters</li>
                <li><strong>Dark/Light Mode:</strong> Remembering your theme preference</li>
              </ul>
            </div>

            <h3 className="text-xl font-medium text-gray-900 mb-3">2.3 Analytics Cookies</h3>
            <p className="text-gray-700 mb-4">
              These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us know which pages are most and least popular and see how visitors move around the site.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Examples:</h4>
              <ul className="list-disc pl-6 text-gray-700">
                <li><strong>Google Analytics:</strong> Understanding user behavior and site performance</li>
                <li><strong>Error Tracking:</strong> Identifying and fixing technical issues</li>
                <li><strong>Feature Usage:</strong> Measuring which trading tools are most popular</li>
                <li><strong>Performance Metrics:</strong> Monitoring page load times and user experience</li>
              </ul>
            </div>

            <h3 className="text-xl font-medium text-gray-900 mb-3">2.4 Marketing Cookies</h3>
            <p className="text-gray-700 mb-4">
              These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Examples:</h4>
              <ul className="list-disc pl-6 text-gray-700">
                <li><strong>Retargeting:</strong> Showing relevant ads to visitors who viewed our site</li>
                <li><strong>Social Media:</strong> Enabling sharing of content on social platforms</li>
                <li><strong>Campaign Tracking:</strong> Measuring the effectiveness of our marketing campaigns</li>
                <li><strong>Affiliate Tracking:</strong> Recording referrals from partner websites</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Specific Cookies We Use</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">Cookie Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">Provider</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">Purpose</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-700">next-auth.session-token</td>
                    <td className="px-4 py-3 text-sm text-gray-700">AI Trader</td>
                    <td className="px-4 py-3 text-sm text-gray-700">User session management</td>
                    <td className="px-4 py-3 text-sm text-gray-700">30 days</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-700">_ga</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Google Analytics</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Distinguish users</td>
                    <td className="px-4 py-3 text-sm text-gray-700">2 years</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-700">_gid</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Google Analytics</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Distinguish users</td>
                    <td className="px-4 py-3 text-sm text-gray-700">24 hours</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-700">aitrader-preferences</td>
                    <td className="px-4 py-3 text-sm text-gray-700">AI Trader</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Store user preferences</td>
                    <td className="px-4 py-3 text-sm text-gray-700">1 year</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-700">aitrader-theme</td>
                    <td className="px-4 py-3 text-sm text-gray-700">AI Trader</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Remember theme setting</td>
                    <td className="px-4 py-3 text-sm text-gray-700">1 year</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-700">sentry-sc</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Sentry</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Error tracking session</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Session</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Third-Party Cookies</h2>
            <p className="text-gray-700 mb-4">
              We work with trusted third-party service providers who may also set cookies on your device through our website:
            </p>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">4.1 Google Analytics</h3>
            <p className="text-gray-700 mb-4">
              We use Google Analytics to understand how visitors interact with our website. Google Analytics uses cookies to collect information about your use of our website anonymously and report website trends without identifying individual visitors.
            </p>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">4.2 Supabase</h3>
            <p className="text-gray-700 mb-4">
              Our authentication and database provider may set cookies to manage user sessions and provide secure authentication services.
            </p>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">4.3 Vercel</h3>
            <p className="text-gray-700 mb-4">
              Our hosting provider may set cookies for performance optimization and load balancing.
            </p>

            <h3 className="text-xl font-medium text-gray-900 mb-3">4.4 Sentry</h3>
            <p className="text-gray-700">
              Our error monitoring service may set cookies to track error sessions and improve our application stability.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. How to Control Cookies</h2>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">5.1 Browser Settings</h3>
            <p className="text-gray-700 mb-4">
              Most web browsers allow you to control cookies through their settings preferences. You can:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Block all cookies</li>
              <li>Allow only first-party cookies</li>
              <li>Delete existing cookies</li>
              <li>Receive notifications when cookies are set</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mb-3">5.2 Browser-Specific Instructions</h3>
            <div className="space-y-4 mb-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Chrome:</h4>
                <p className="text-gray-700">Settings → Privacy and Security → Cookies and other site data</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Firefox:</h4>
                <p className="text-gray-700">Settings → Privacy & Security → Cookies and Site Data</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Safari:</h4>
                <p className="text-gray-700">Preferences → Privacy → Manage Website Data</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Edge:</h4>
                <p className="text-gray-700">Settings → Site permissions → Cookies and site data</p>
              </div>
            </div>

            <h3 className="text-xl font-medium text-gray-900 mb-3">5.3 Opt-Out Options</h3>
            <p className="text-gray-700 mb-4">
              You can opt out of specific tracking services:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>Google Analytics:</strong> <a href="https://tools.google.com/dlpage/gaoptout" className="text-blue-600 hover:underline">Google Analytics Opt-out Browser Add-on</a></li>
              <li><strong>Advertising Cookies:</strong> <a href="http://www.aboutads.info/choices/" className="text-blue-600 hover:underline">Digital Advertising Alliance</a></li>
              <li><strong>European Users:</strong> <a href="http://www.youronlinechoices.eu/" className="text-blue-600 hover:underline">Your Online Choices</a></li>
            </ul>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Important:</strong> Blocking or deleting cookies may impact the functionality of our trading platform, including your ability to stay logged in and access certain features.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Mobile Devices</h2>
            <p className="text-gray-700 mb-4">
              When you access our website through mobile apps or mobile browsers, we may use technologies similar to cookies, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>Local Storage:</strong> Data stored locally on your device</li>
              <li><strong>Session Storage:</strong> Temporary data for your current session</li>
              <li><strong>Device Identifiers:</strong> Unique identifiers for your mobile device</li>
              <li><strong>App Analytics:</strong> Usage data from our mobile applications</li>
            </ul>
            <p className="text-gray-700">
              You can control these through your device settings or app permissions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Updates to This Cookie Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. When we make changes, we will update the "Last updated" date at the top of this policy.
            </p>
            <p className="text-gray-700">
              We encourage you to review this Cookie Policy periodically to stay informed about our use of cookies and related technologies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about our use of cookies or this Cookie Policy, please contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-2"><strong>Email:</strong> privacy@aitrader.com</p>
              <p className="text-gray-700 mb-2"><strong>Address:</strong> AI Trader Privacy Office</p>
              <p className="text-gray-700 mb-2">123 Financial District</p>
              <p className="text-gray-700 mb-2">New York, NY 10004</p>
              <p className="text-gray-700"><strong>Phone:</strong> +1 (555) 123-4567</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Consent</h2>
            <p className="text-gray-700">
              By continuing to use our website, you consent to our use of cookies as described in this Cookie Policy. If you do not agree to our use of cookies, you should set your browser settings accordingly or refrain from using our website.
            </p>
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