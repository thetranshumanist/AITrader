import Link from "next/link";
import { ArrowRight, TrendingUp, Shield, Zap, BarChart3, Activity, Globe } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-gray-900">AI Trader</span>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <Link href="#features" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors">
                  Features
                </Link>
                <Link href="#pricing" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors">
                  Pricing
                </Link>
                <Link href="#about" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors">
                  About
                </Link>
                <Link href="/sign-in" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors">
                  Sign In
                </Link>
                <Link 
                  href="/sign-up" 
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Automated Trading
              <br />
              <span className="text-blue-600">Made Simple</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Professional-grade algorithmic trading platform with real-time market analysis,
              automated execution, and comprehensive portfolio management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/sign-up"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-blue-700 transition-all hover:scale-105 flex items-center gap-2"
              >
                Start Trading Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="#demo"
                className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-medium hover:border-gray-400 transition-colors"
              >
                Watch Demo
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-4">No credit card required • 14-day free trial</p>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-20">
            <div className="relative">
              <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-sm text-green-600 font-medium">Total Portfolio Value</div>
                      <div className="text-2xl font-bold text-green-700">$127,843.21</div>
                      <div className="text-sm text-green-600">+2.34% today</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-sm text-blue-600 font-medium">Active Positions</div>
                      <div className="text-2xl font-bold text-blue-700">23</div>
                      <div className="text-sm text-blue-600">8 signals pending</div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="text-sm text-purple-600 font-medium">Today's P&L</div>
                      <div className="text-2xl font-bold text-purple-700">+$2,891.43</div>
                      <div className="text-sm text-purple-600">12 trades executed</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="text-center text-gray-500">
                      <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p>Interactive Trading Dashboard</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to trade smarter
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features built for professional traders and investors
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Real-time Analysis</h3>
              <p className="text-gray-600">
                Advanced technical indicators including MACD, RSI, and Stochastic Oscillator for precise market analysis.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Automated Execution</h3>
              <p className="text-gray-600">
                Lightning-fast trade execution with automated order management and risk controls.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Risk Management</h3>
              <p className="text-gray-600">
                Built-in risk controls with stop-loss orders, position sizing, and portfolio diversification.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Portfolio Analytics</h3>
              <p className="text-gray-600">
                Comprehensive performance tracking with detailed analytics and reporting.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-6">
                <Globe className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Multi-Asset Support</h3>
              <p className="text-gray-600">
                Trade stocks and cryptocurrencies from a single unified platform.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Smart Signals</h3>
              <p className="text-gray-600">
                AI-powered trading signals with confidence scoring and detailed reasoning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Trading Plan
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start with our free tier or upgrade to unlock advanced features and real-time data
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Free Tier */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-8 relative">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Free Tier</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">$0</span>
                  <span className="text-gray-600">/30 days</span>
                </div>
                <p className="text-sm text-gray-600 mb-6">Perfect for beginners and casual investors testing the platform</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-700">$0 commission on stock and ETF trades</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-700">Basic market data (15-minute delay)</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-700">Limited API access (up to 50 calls/minute)</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-700">No minimum deposit</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-700">Fractional shares available</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-700">Access to educational resources</span>
                </li>
              </ul>
              
              <Link 
                href="/sign-up"
                className="w-full bg-gray-900 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors text-center block"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Basic Plan */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-8 relative">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Basic Plan</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">$4.99</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="text-sm text-gray-600 mb-6">Best for active traders who need real-time data and basic analytics</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-700">$0 commission on stock and ETF trades</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-700">Real-time market data (U.S. markets)</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-700">Up to 1,000 API calls/minute</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-700">AI insights (powered by Gemini)</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-700">Priority customer support</span>
                </li>
              </ul>
              
              <Link 
                href="/sign-up"
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors text-center block"
              >
                Choose Basic
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-white rounded-xl border-2 border-blue-500 p-8 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">Most Popular</span>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Pro Plan</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">$19.99</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="text-sm text-gray-600 mb-6">Best for serious traders who need advanced analytics and higher limits</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-700">$0 commission on stock and ETF trades</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-700">Real-time market data (U.S. markets)</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-700">Up to 5,000 API calls/minute</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-700">Advanced AI insights (powered by Gemini)</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-700">Priority customer support</span>
                </li>
              </ul>
              
              <Link 
                href="/sign-up"
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors text-center block"
              >
                Choose Pro
              </Link>
            </div>

            {/* Elite Plan */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-8 relative">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Elite Plan</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">$49.99</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="text-sm text-gray-600 mb-6">Best for professional traders and institutions with high-volume needs</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-700">$0 commission on stock and ETF trades</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-700">Real-time market data (U.S. markets)</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-700">Unlimited API calls</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-700">Advanced AI insights (powered by Gemini)</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-700">Lower margin rates (for deposits over $25,000)</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-700">Priority customer support</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-700">Early access to new features</span>
                </li>
              </ul>
              
              <Link 
                href="/sign-up"
                className="w-full bg-gray-900 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors text-center block"
              >
                Choose Elite
              </Link>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">All plans include commission-free stock and ETF trades</p>
            <p className="text-sm text-gray-500">Prices exclude applicable taxes. Cancel anytime.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to start automated trading?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of traders who trust AI Trader for their automated trading needs.
          </p>
          <Link 
            href="/sign-up"
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">AI Trader</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Professional automated trading platform for stocks and cryptocurrencies.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/api" className="hover:text-white transition-colors">API</Link></li>
                <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} AI Trader. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}