import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Shield,
  BarChart3,
  Upload,
  Smartphone,
  Globe
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const features = [
    {
      icon: TrendingUp,
      title: 'Smart Analytics',
      description: 'AI-powered insights to help you make better financial decisions'
    },
    {
      icon: Shield,
      title: 'Bank-level Security',
      description: 'Your data is protected with enterprise-grade security'
    },
    {
      icon: BarChart3,
      title: 'Rich Visualizations',
      description: 'Beautiful charts and graphs to track your financial journey'
    },
    {
      icon: Upload,
      title: 'Receipt Scanning',
      description: 'Upload receipts and let AI extract transaction details automatically'
    },
    {
      icon: Smartphone,
      title: 'Multi-device Sync',
      description: 'Access your finances from anywhere, anytime'
    },
    {
      icon: Globe,
      title: 'Indian Currency',
      description: 'Built specifically for Indian users with ₹ support'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      {/* Navigation */}
      <nav className="px-6 py-4 lg:px-8">
        <div className="flex items-center justify-between">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold text-gray-900"
          >
            Finance Pro
          </motion.h1>
          <div className="space-x-4">
            <Link
              to="/login"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="px-6 py-16 lg:px-8 lg:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl lg:text-7xl font-bold text-gray-900 mb-6"
          >
            Take Control of Your
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {' '}Finances
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            The most comprehensive personal finance management app designed for Indian users. 
            Track expenses, manage investments, and get AI-powered insights to grow your wealth.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-x-4"
          >
            <Link
              to="/register"
              className="inline-block bg-black text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-800 transition-all duration-200 transform hover:scale-105"
            >
              Start Free Today
            </Link>
            <Link
              to="/login"
              className="inline-block border-2 border-black text-black px-8 py-4 rounded-lg font-bold text-lg hover:bg-black hover:text-white transition-all duration-200"
            >
              Sign In
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-6 py-16 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Money
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to give you complete control over your financial life
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="bg-gray-50 p-8 rounded-2xl hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-6">
                    <Icon size={24} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-6 py-16 lg:px-8 bg-black text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold mb-6"
          >
            Ready to Transform Your Financial Future?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto"
          >
            Join thousands of users who have already taken control of their finances with our platform.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Link
              to="/register"
              className="inline-block bg-white text-black px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105"
            >
              Get Started Now - It's Free
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;