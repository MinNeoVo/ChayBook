import React from 'react';
import { Link } from 'react-router-dom';
import { Share2, MessageSquare, Mail } from 'lucide-react';

function Footer() {
  return (
    <footer className="w-full bg-[#ebefec] border-t border-gray-200/80 pt-16 pb-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Grid Sections - Đúng 5 cột như thiết kế của bạn */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-gray-300/60">
          {/* Col 1: Logo & Info */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#006b2c] flex items-center justify-center text-white font-bold text-base shadow-sm">
                C
              </div>
              <span className="text-xl font-bold tracking-tight text-[#006b2c]">
                ChayBook
              </span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Eat Better. Live Healthier. Your complete companion for a thriving vegetarian lifestyle.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-2 pt-2">
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-gray-600 hover:text-[#006b2c] hover:bg-gray-50 transition-colors shadow-xs"
                aria-label="Share"
              >
                <Share2 className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-gray-600 hover:text-[#006b2c] hover:bg-gray-50 transition-colors shadow-xs"
                aria-label="Message"
              >
                <MessageSquare className="w-4 h-4" />
              </a>
              <a
                href="mailto:contact@chaybook.com"
                className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-gray-600 hover:text-[#006b2c] hover:bg-gray-50 transition-colors shadow-xs"
                aria-label="Contact Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Explore */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Explore
            </h4>
            <ul className="flex flex-col gap-2 text-xs text-gray-600">
              <li><Link to="/content" className="hover:text-[#006b2c] transition-colors">Nutrition Guides</Link></li>
              <li><Link to="/content" className="hover:text-[#006b2c] transition-colors">Healthy Recipes</Link></li>
              <li><Link to="/content" className="hover:text-[#006b2c] transition-colors">Video Tutorials</Link></li>
              <li><Link to="/content" className="hover:text-[#006b2c] transition-colors">Meal Plans</Link></li>
            </ul>
          </div>

          {/* Col 3: Interactive Tools */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Interactive Tools
            </h4>
            <ul className="flex flex-col gap-2 text-xs text-gray-600">
              <li><Link to="/ai-assistant" className="hover:text-[#006b2c] transition-colors">AI Nutrition Assistant</Link></li>
              <li><Link to="/bmi" className="hover:text-[#006b2c] transition-colors">BMI Calculator</Link></li>
              <li><Link to="/bmi" className="hover:text-[#006b2c] transition-colors">Macro Analyzer</Link></li>
              <li><Link to="/bmi" className="hover:text-[#006b2c] transition-colors">Daily Calorie Tracker</Link></li>
            </ul>
          </div>

          {/* Col 4: Community */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Community
            </h4>
            <ul className="flex flex-col gap-2 text-xs text-gray-600">
              <li><Link to="/community" className="hover:text-[#006b2c] transition-colors">Discussions</Link></li>
              <li><Link to="/community" className="hover:text-[#006b2c] transition-colors">Member Stories</Link></li>
              <li><Link to="/community" className="hover:text-[#006b2c] transition-colors">Dietary Guidelines</Link></li>
              <li><Link to="/community" className="hover:text-[#006b2c] transition-colors">Weekly Challenges</Link></li>
            </ul>
          </div>

          {/* Col 5: Contact & Legal */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Contact & Legal
            </h4>
            <ul className="flex flex-col gap-2 text-xs text-gray-600">
              <li>
                <a href="mailto:contact@chaybook.com" className="hover:text-[#006b2c] transition-colors">
                  contact@chaybook.com
                </a>
              </li>
              <li><a href="#" className="hover:text-[#006b2c] transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-[#006b2c] transition-colors">Terms of Service</a></li>
              <li className="text-gray-400 pt-1">FPT University Capstone Initiative</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© 2025 ChayBook. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-[#006b2c] transition-colors">Cookies</a>
            <a href="#" className="hover:text-[#006b2c] transition-colors">Security</a>
            <a href="#" className="hover:text-[#006b2c] transition-colors">Accessibility</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;