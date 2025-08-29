import Link from "next/link";
import { TrendingUp, ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-600">Last updated: December 29, 2024</p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4">
              Welcome to AI Trader. These Terms of Service ("Terms") govern your use of the AI Trader platform, website, and related services (collectively, the "Service") operated by AI Trader Inc. ("Company," "we," "our," or "us").
            </p>
            <p className="text-gray-700">
              By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these terms, then you may not access the Service. These Terms apply to all visitors, users, and others who access or use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 mb-4">
              AI Trader is an automated trading platform that provides:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>AI-powered trading algorithms and signal generation</li>
              <li>Real-time market data and technical analysis</li>
              <li>Portfolio management and tracking tools</li>
              <li>Automated trade execution through licensed brokerage partners</li>
              <li>Risk management and compliance monitoring</li>
              <li>Educational resources and market insights</li>
            </ul>
            <p className="text-gray-700">
              Our Service is designed for informational and trading purposes only and does not constitute financial advice, investment recommendations, or guarantees of trading success.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Eligibility and Account Registration</h2>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">3.1 Eligibility Requirements</h3>
            <p className="text-gray-700 mb-4">To use our Service, you must:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Be at least 18 years of age</li>
              <li>Have the legal capacity to enter into binding contracts</li>
              <li>Not be prohibited from using financial services under applicable laws</li>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mb-3">3.2 Account Verification</h3>
            <p className="text-gray-700 mb-4">
              You agree to provide accurate, current, and complete information during registration and to update such information as necessary. We reserve the right to verify your identity through Know Your Customer (KYC) procedures, which may include:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Government-issued identification verification</li>
              <li>Address verification</li>
              <li>Financial status assessment</li>
              <li>Background checks as required by law</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Trading and Financial Services</h2>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">4.1 No Investment Advice</h3>
            <p className="text-gray-700 mb-4">
              AI Trader provides trading tools and automated execution services but does not provide investment advice, financial planning, or recommendations. All trading decisions made through our platform are your sole responsibility. You acknowledge that:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Trading involves substantial risk of loss</li>
              <li>Past performance does not guarantee future results</li>
              <li>You may lose more than your initial investment</li>
              <li>Market conditions can change rapidly and unpredictably</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mb-3">4.2 Brokerage Services</h3>
            <p className="text-gray-700 mb-4">
              We partner with licensed brokerage firms to execute trades on your behalf. By using our Service, you agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Comply with all brokerage terms and conditions</li>
              <li>Provide necessary authorization for automated trading</li>
              <li>Maintain sufficient funds in your brokerage account</li>
              <li>Accept responsibility for all executed trades</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mb-3">4.3 Algorithm Performance</h3>
            <p className="text-gray-700">
              While we strive to provide accurate signals and reliable automated trading, we do not guarantee the performance of our algorithms or trading strategies. Market conditions, technical issues, or other factors may affect algorithm performance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Fees and Payments</h2>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">5.1 Service Fees</h3>
            <p className="text-gray-700 mb-4">
              Our pricing is clearly displayed on our website and may include:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Monthly or annual subscription fees</li>
              <li>Performance-based fees on profitable trades</li>
              <li>Premium feature access fees</li>
              <li>Data feed and API usage fees</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mb-3">5.2 Third-Party Fees</h3>
            <p className="text-gray-700 mb-4">
              You are responsible for all third-party fees, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Brokerage commissions and fees</li>
              <li>Market data fees</li>
              <li>Banking and wire transfer fees</li>
              <li>Currency conversion fees</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mb-3">5.3 Billing and Refunds</h3>
            <p className="text-gray-700">
              Fees are billed in advance and are non-refundable except as required by law or as specifically stated in our refund policy. We reserve the right to change our pricing with 30 days' notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. User Responsibilities and Prohibited Uses</h2>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">6.1 Acceptable Use</h3>
            <p className="text-gray-700 mb-4">You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Violate any applicable laws or regulations</li>
              <li>Engage in market manipulation or insider trading</li>
              <li>Attempt to circumvent security measures</li>
              <li>Share your account credentials with others</li>
              <li>Use the Service for money laundering or other illegal activities</li>
              <li>Reverse engineer or attempt to access our proprietary algorithms</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mb-3">6.2 Compliance Obligations</h3>
            <p className="text-gray-700">
              You are responsible for complying with all applicable laws and regulations, including tax obligations, securities laws, and anti-money laundering requirements in your jurisdiction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Privacy and Data Protection</h2>
            <p className="text-gray-700 mb-4">
              Your privacy is important to us. Our collection, use, and protection of your personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.
            </p>
            <p className="text-gray-700">
              By using our Service, you consent to the collection, use, and sharing of your information as described in our Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Intellectual Property Rights</h2>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">8.1 Our Intellectual Property</h3>
            <p className="text-gray-700 mb-4">
              The Service and its original content, features, and functionality are owned by AI Trader and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>

            <h3 className="text-xl font-medium text-gray-900 mb-3">8.2 Limited License</h3>
            <p className="text-gray-700 mb-4">
              We grant you a limited, non-exclusive, non-transferable license to access and use the Service for your personal or internal business purposes, subject to these Terms.
            </p>

            <h3 className="text-xl font-medium text-gray-900 mb-3">8.3 User Content</h3>
            <p className="text-gray-700">
              You retain ownership of any content you submit to the Service but grant us a license to use, modify, and display such content in connection with operating the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Disclaimers and Limitation of Liability</h2>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">9.1 Service Disclaimers</h3>
            <p className="text-gray-700 mb-4">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, INCLUDING:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE</li>
              <li>ACCURACY, RELIABILITY, OR COMPLETENESS OF INFORMATION</li>
              <li>UNINTERRUPTED OR ERROR-FREE OPERATION</li>
              <li>TRADING PROFITABILITY OR INVESTMENT RETURNS</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mb-3">9.2 Limitation of Liability</h3>
            <p className="text-gray-700 mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, AI TRADER SHALL NOT BE LIABLE FOR:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>TRADING LOSSES OR INVESTMENT DAMAGES</li>
              <li>INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES</li>
              <li>LOST PROFITS OR BUSINESS INTERRUPTION</li>
              <li>DAMAGES EXCEEDING THE FEES PAID FOR THE SERVICE</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Indemnification</h2>
            <p className="text-gray-700">
              You agree to defend, indemnify, and hold harmless AI Trader, its officers, directors, employees, and agents from any claims, damages, obligations, losses, liabilities, costs, or debt arising from your use of the Service, violation of these Terms, or violation of any third-party rights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Termination</h2>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">11.1 Termination by You</h3>
            <p className="text-gray-700 mb-4">
              You may terminate your account at any time by contacting customer support or through your account settings. Upon termination, your right to use the Service will cease immediately.
            </p>

            <h3 className="text-xl font-medium text-gray-900 mb-3">11.2 Termination by Us</h3>
            <p className="text-gray-700 mb-4">
              We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason.
            </p>

            <h3 className="text-xl font-medium text-gray-900 mb-3">11.3 Effect of Termination</h3>
            <p className="text-gray-700">
              Upon termination, all rights and licenses granted to you will cease, and you must stop using the Service. Provisions that by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, and limitations of liability.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Dispute Resolution</h2>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">12.1 Governing Law</h3>
            <p className="text-gray-700 mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the State of New York, without regard to its conflict of law provisions.
            </p>

            <h3 className="text-xl font-medium text-gray-900 mb-3">12.2 Arbitration</h3>
            <p className="text-gray-700 mb-4">
              Any dispute arising from these Terms or the Service shall be resolved through binding arbitration administered by the American Arbitration Association under its Commercial Arbitration Rules.
            </p>

            <h3 className="text-xl font-medium text-gray-900 mb-3">12.3 Class Action Waiver</h3>
            <p className="text-gray-700">
              You agree that any arbitration or legal proceeding shall be limited to the dispute between you and AI Trader individually. You waive any right to participate in a class action lawsuit or class-wide arbitration.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Regulatory Compliance</h2>
            <p className="text-gray-700 mb-4">
              AI Trader operates in compliance with applicable financial regulations, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Securities and Exchange Commission (SEC) regulations</li>
              <li>Financial Industry Regulatory Authority (FINRA) rules</li>
              <li>Anti-Money Laundering (AML) requirements</li>
              <li>Bank Secrecy Act (BSA) provisions</li>
            </ul>
            <p className="text-gray-700">
              Users are responsible for ensuring their trading activities comply with applicable laws in their jurisdiction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Changes to Terms</h2>
            <p className="text-gray-700">
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. Continued use of the Service after changes become effective constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-2"><strong>Email:</strong> legal@aitrader.com</p>
              <p className="text-gray-700 mb-2"><strong>Address:</strong> AI Trader Legal Department</p>
              <p className="text-gray-700 mb-2">123 Financial District</p>
              <p className="text-gray-700 mb-2">New York, NY 10004</p>
              <p className="text-gray-700"><strong>Phone:</strong> +1 (555) 123-4567</p>
            </div>
          </section>

          <section className="mb-8">
            <p className="text-gray-700 italic">
              By using AI Trader, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
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