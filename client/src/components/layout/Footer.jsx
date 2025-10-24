import { Link } from 'react-router-dom'
import { Leaf, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-forest-green-800 text-cream-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-cream-500 rounded-full">
                <Leaf className="h-6 w-6 text-forest-green-800" />
              </div>
              <span className="text-xl font-bold">UrbanSprout</span>
            </div>
            <p className="text-cream-200 text-sm leading-relaxed">
              Cultivating green spaces in urban environments. Join us in making cities more sustainable and beautiful, one plant at a time.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-cream-200 hover:text-cream-100 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-cream-200 hover:text-cream-100 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-cream-200 hover:text-cream-100 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-cream-200 hover:text-cream-100 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-cream-200 hover:text-cream-100 transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-cream-200 hover:text-cream-100 transition-colors text-sm">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/plant-suggestion" className="text-cream-200 hover:text-cream-100 transition-colors text-sm">
                  Plant Suggestions
                </Link>
              </li>
              <li>
                <Link to="/store" className="text-cream-200 hover:text-cream-100 transition-colors text-sm">
                  Store
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Services</h3>
            <ul className="space-y-2">
              <li className="text-cream-200 text-sm">Plant Care Consultation</li>
              <li className="text-cream-200 text-sm">Urban Garden Design</li>
              <li className="text-cream-200 text-sm">Plant Delivery</li>
              <li className="text-cream-200 text-sm">Maintenance Services</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-cream-300" />
                <span className="text-cream-200 text-sm">hello@urbansprout.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-cream-300" />
                <span className="text-cream-200 text-sm">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-cream-300" />
                <span className="text-cream-200 text-sm">123 Green Street, Urban City</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-forest-green-700">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-cream-200 text-sm">
              © {currentYear} UrbanSprout. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-cream-200 hover:text-cream-100 transition-colors text-sm">
                Privacy Policy
              </a>
              <a href="#" className="text-cream-200 hover:text-cream-100 transition-colors text-sm">
                Terms of Service
              </a>
              <a href="#" className="text-cream-200 hover:text-cream-100 transition-colors text-sm">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer