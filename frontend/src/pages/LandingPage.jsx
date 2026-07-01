// frontend/src/pages/LandingPage.jsx
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, Shield, Zap, Globe, CheckCircle, 
  Star, ChevronDown, ArrowRight, BarChart3, 
  Boxes, Smartphone, PieChart, Users, Receipt,
  Rocket, PlayCircle, Phone, MessageCircle, ToggleLeft, ToggleRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import WhatsAppSupport from '../components/WhatsAppSupport';

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [isYearly, setIsYearly] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    { icon: Zap, title: "Lightning Fast Checkout", desc: "Process sales in seconds with barcode scanning, quick product search, and one-touch payments. No more long queues." },
    { icon: Boxes, title: "Smart Inventory", desc: "Track stock levels in real-time. Get low-stock alerts before you run out. Never lose a sale to empty shelves." },
    { icon: Smartphone, title: "MTN MoMo & Cards", desc: "Accept Mobile Money, bank cards, and cash — all integrated seamlessly with Paystack for instant settlements." },
    { icon: PieChart, title: "Real-Time Reports", desc: "See your best-selling products, peak hours, and profit margins. Make data-driven decisions for your business." },
    { icon: Users, title: "Multi-User Access", desc: "Give each staff member their own PIN. Track who sold what. Admin, Manager, and Cashier roles built-in." },
    { icon: Receipt, title: "Digital Receipts", desc: "Print thermal receipts or send digital receipts via SMS/WhatsApp. Professional branding on every transaction." },
  ];

  const steps = [
    { num: "1", title: "Create Your Shop", desc: "Sign up with your shop name, choose your plan, and set your admin PIN. No credit card required for the free trial." },
    { num: "2", title: "Add Your Products", desc: "Upload your inventory via CSV or add products one by one. Set prices, stock levels, and categories in minutes." },
    { num: "3", title: "Start Selling", desc: "Login with your shop URL and PIN. Scan, sell, and accept payments. Your first sale is just minutes away!" },
  ];

  const pricing = [
    { 
      name: "Starter", 
      monthlyPrice: 0, 
      displayPrice: "Free", 
      period: "14-day trial", 
      yearlyPrice: 0,
      features: ["1 User", "200 Products", "Basic Reports", "MTN MoMo", "Email Support"], 
      popular: false, 
      cta: "Start Free Trial" 
    },
    { 
      name: "Basic", 
      monthlyPrice: 149, 
      displayPrice: "GHS 149", 
      period: "/mo", 
      yearlyPrice: 1490,
      features: ["3 Users", "1,000 Products", "Advanced Reports", "MTN MoMo + Cards", "Priority Support"], 
      popular: true, 
      cta: "Start Free Trial" 
    },
    { 
      name: "Pro", 
      monthlyPrice: 349, 
      displayPrice: "GHS 349", 
      period: "/mo", 
      yearlyPrice: 3490,
      features: ["8 Users", "5,000 Products", "All Features", "Offline Mode", "24/7 Support"], 
      popular: false, 
      cta: "Start Free Trial" 
    },
    { 
      name: "Enterprise", 
      monthlyPrice: 799, 
      displayPrice: "GHS 799", 
      period: "/mo", 
      yearlyPrice: 7990,
      features: ["Unlimited Users", "Unlimited Products", "Multi-branch", "API Access", "Dedicated Manager"], 
      popular: false, 
      cta: "Contact Sales" 
    },
  ];

  const testimonials = [
    { name: "Kwame Asante", role: "Owner, Asante Supermarket, Accra", text: "WAG POS transformed my supermarket in Accra. I can now track inventory in real-time and accept MTN MoMo payments. My customers love the fast checkout!", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" },
    { name: "Dr. Abena Mensah", role: "Owner, Mensah Pharmacy, Kumasi", text: "As a pharmacy owner, I needed something simple but powerful. WAG POS handles my prescriptions, inventory, and payments perfectly. The low-stock alerts save me from running out of critical medicines.", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face" },
    { name: "Ibrahim Sulemana", role: "Owner, Sulemana Mini-Mart, Tamale", text: "I run a mini-mart in Tamale. The free Starter plan was perfect to begin with. When I grew, upgrading to Basic was seamless. Now I have 3 cashiers using the system daily!", img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face" },
  ];

  const faqs = [
    { q: "Is WAG POS really free to start?", a: "Yes! Start with a 14-day free trial on any plan. No credit card required. After the trial, choose the plan that fits your business. Upgrade or downgrade anytime." },
    { q: "Can I accept MTN Mobile Money payments?", a: "Absolutely! WAG POS integrates with Paystack to accept MTN MoMo, Vodafone Cash, AirtelTigo Money, and all major bank cards. Payments settle directly to your Ghanaian bank account." },
    { q: "Do I need special hardware?", a: "No! WAG POS works on any device with a browser — laptop, tablet, or even your phone. For the best experience, we recommend a tablet or touchscreen monitor at your checkout counter." },
    { q: "Is my data secure?", a: "Yes! We use bank-grade SSL encryption, JWT authentication, rate limiting, and input validation. Your data is stored on secure PostgreSQL databases with automated backups." },
    { q: "Can I use WAG POS for multiple shops?", a: "Yes! Each shop gets its own unique URL and isolated data. You can manage multiple locations from one account. Perfect for chains and franchises." },
  ];

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="font-sans text-slate-800 overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2 text-2xl font-extrabold text-blue-600 hover:opacity-80 transition-opacity">
            <ShoppingBag className="w-8 h-8" />
            WAG POS
          </button>
          <ul className="hidden md:flex gap-8 list-none">
            {[
              { label: 'Features', id: 'features' },
              { label: 'How It Works', id: 'how-it-works' },
              { label: 'Pricing', id: 'pricing' },
              { label: 'FAQ', id: 'faq' },
            ].map((item) => (
              <li key={item.id}>
                <button onClick={() => scrollTo(item.id)} className="text-slate-500 font-medium hover:text-blue-600 transition-colors">
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
          <button onClick={() => navigate('/login')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-all hover:-translate-y-0.5">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center bg-gradient-to-br from-slate-800 via-slate-700 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'40\' fill=\'none\' stroke=\'rgba(255,255,255,0.3)\' stroke-width=\'0.5\'/%3E%3C/svg%3E")',
          backgroundSize: '60px 60px',
        }} />

        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10 pt-20">
          <div>
            <div className="flex flex-wrap gap-3 mb-6">
              {[
                { icon: CheckCircle, text: "Made for Ghana" },
                { icon: Smartphone, text: "MTN MoMo Ready" },
                { icon: Shield, text: "Bank-Grade Security" },
              ].map((badge, i) => (
                <span key={i} className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm flex items-center gap-2 border border-white/20">
                  <badge.icon className="w-4 h-4 text-amber-400" />
                  {badge.text}
                </span>
              ))}
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-6">
              The Modern POS Built for <span className="text-amber-400">Ghanaian Businesses</span>
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-lg leading-relaxed">
              From supermarkets to pharmacies, WAG POS helps you sell faster, track inventory smarter, and accept payments seamlessly — all in one powerful platform.
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => navigate('/login')} className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-2 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/30">
                <Rocket className="w-5 h-5" />
                Start Free Trial
              </button>
              <button onClick={() => scrollTo('features')} className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold transition-all border border-white/20 flex items-center gap-2">
                <PlayCircle className="w-5 h-5" />
                See How It Works
              </button>
            </div>
          </div>
          <div className="hidden md:block relative">
            <img 
              src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop" 
              alt="WAG POS Dashboard" 
              className="w-full rounded-2xl shadow-2xl"
              style={{ transform: 'perspective(1000px) rotateY(-5deg)', transition: 'transform 0.5s' }}
              onMouseEnter={(e) => e.target.style.transform = 'perspective(1000px) rotateY(0deg)'}
              onMouseLeave={(e) => e.target.style.transform = 'perspective(1000px) rotateY(-5deg)'}
            />
            <div className="absolute -top-4 -right-4 bg-white p-4 rounded-xl shadow-xl animate-bounce" style={{ animationDuration: '3s' }}>
              <BarChart3 className="w-6 h-6 text-emerald-600 mb-1" />
              <div className="font-bold text-slate-800">GHS 23,450</div>
              <div className="text-xs text-slate-400">This Month</div>
            </div>
            <div className="absolute bottom-8 -left-6 bg-white p-4 rounded-xl shadow-xl animate-bounce" style={{ animationDuration: '3s', animationDelay: '1.5s' }}>
              <ShoppingBag className="w-6 h-6 text-blue-600 mb-1" />
              <div className="font-bold text-slate-800">1,234 Sales</div>
              <div className="text-xs text-slate-400">Today</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl font-extrabold text-slate-800 mb-4">Everything You Need to Run Your Shop</h2>
            <p className="text-slate-500 text-lg">Powerful features designed specifically for Ghanaian retail businesses</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-all hover:-translate-y-1 border border-slate-100">
                <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl font-extrabold text-slate-800 mb-4">Get Started in 3 Simple Steps</h2>
            <p className="text-slate-500 text-lg">From signup to first sale in under 10 minutes</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {steps.map((step, i) => (
              <div key={i} className="text-center relative">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-extrabold mx-auto mb-6 shadow-lg shadow-blue-600/30">
                  {step.num}
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-4xl font-extrabold text-slate-800 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-slate-500 text-lg">Start with a 14-day free trial. Upgrade when you grow. No hidden fees.</p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-12">
            <div className="bg-gray-100 rounded-full p-1 flex items-center">
              <button
                onClick={() => setIsYearly(false)}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  !isYearly ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                  isYearly ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Yearly
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold">Save 17%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {pricing.map((plan, i) => (
              <div key={i} className={`bg-white rounded-2xl p-8 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl border-2 relative ${plan.popular ? 'border-amber-400 scale-105' : 'border-transparent hover:border-blue-200'}`}>
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-800 px-4 py-1 rounded-full text-sm font-bold">Most Popular</span>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="my-4">
                  <span className="text-4xl font-black text-blue-600">
                    {isYearly && plan.yearlyPrice > 0 ? `GHS ${plan.yearlyPrice.toLocaleString()}` : plan.displayPrice}
                  </span>
                  <span className="text-base text-slate-400 font-normal">
                    {isYearly && plan.yearlyPrice > 0 ? '/yr' : plan.period}
                  </span>
                </div>
                {isYearly && plan.yearlyPrice > 0 && (
                  <p className="text-sm text-green-600 font-medium mb-4">
                    Save GHS {(plan.monthlyPrice * 12 - plan.yearlyPrice).toLocaleString()} vs monthly
                  </p>
                )}
                {plan.monthlyPrice === 0 && !isYearly && (
                  <p className="text-sm text-slate-500 mb-4">No credit card required</p>
                )}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-slate-500">
                      <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => navigate('/login')}
                  className={`w-full py-3 rounded-xl font-bold transition-all hover:-translate-y-0.5 ${
                    plan.popular 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25' 
                      : 'bg-slate-100 hover:bg-slate-200 text-blue-600'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>

          {/* Enterprise CTA */}
          <div className="mt-12 text-center">
            <p className="text-slate-500">
              Need a custom plan?{' '}
              <button onClick={() => window.location.href = 'mailto:sales@wagpos.com'} className="text-blue-600 font-semibold hover:text-blue-700">
                Contact our sales team →
              </button>
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl font-extrabold mb-4">Loved by Shop Owners Across Ghana</h2>
            <p className="text-blue-200 text-lg">See what business owners are saying about WAG POS</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10">
                <div className="flex gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-5 h-5 fill-current" />)}
                </div>
                <p className="italic mb-6 leading-relaxed text-blue-100">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-4">
                  <img src={t.img} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <h4 className="font-bold">{t.name}</h4>
                    <span className="text-sm text-blue-300">{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl font-extrabold text-slate-800 mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-500 text-lg">Got questions? We&apos;ve got answers.</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-slate-200">
                <button 
                  onClick={() => setActiveFaq(activeFaq === i ? -1 : i)}
                  className="w-full flex justify-between items-center py-5 text-left font-semibold text-lg hover:text-blue-600 transition-colors"
                >
                  {faq.q}
                  <ChevronDown className={`w-5 h-5 text-blue-600 transition-transform duration-300 ${activeFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${activeFaq === i ? 'max-h-48 pb-5' : 'max-h-0'}`}>
                  <p className="text-slate-500 leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 to-blue-800 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl font-extrabold mb-4">Ready to Transform Your Business?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-xl mx-auto">
            Join hundreds of Ghanaian shop owners already using WAG POS to sell smarter, faster, and safer.
          </p>
          <button onClick={() => navigate('/login')} className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-10 py-4 rounded-xl font-extrabold text-lg transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/30 inline-flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            Start Your Free Trial Now
          </button>
          <p className="text-sm text-blue-200 mt-4">14-day free trial • No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 mb-12">
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ShoppingBag className="w-6 h-6" />
              WAG POS
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              The modern point of sale system built for Ghanaian businesses. From supermarkets to pharmacies, we help you sell smarter.
            </p>
            <div className="flex gap-3">
              {['facebook', 'twitter', 'instagram', 'linkedin'].map((social) => (
                <a key={social} href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-blue-600 transition-all hover:-translate-y-1">
                  <span className="sr-only">{social}</span>
                  <Globe className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-4">Product</h4>
            <ul className="space-y-2">
              {['Features', 'Pricing', 'Changelog', 'Roadmap'].map((item) => (
                <li key={item}><button onClick={() => scrollTo(item.toLowerCase())} className="text-slate-400 hover:text-amber-400 transition-colors text-sm">{item}</button></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Company</h4>
            <ul className="space-y-2">
              {['About Us', 'Blog', 'Careers', 'Contact'].map((item) => (
                <li key={item}><span className="text-slate-400 text-sm">{item}</span></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Support</h4>
            <ul className="space-y-2">
              <li><span className="text-slate-400 text-sm">Help Center</span></li>
              <li><span className="text-slate-400 text-sm">API Docs</span></li>
              <li><span className="text-slate-400 text-sm">Status</span></li>
              <li><a href="mailto:support@wagpos.com" className="text-slate-400 hover:text-amber-400 transition-colors text-sm">support@wagpos.com</a></li>
            </ul>
          </div>
        </div>
        <div className="text-center pt-8 border-t border-white/10 text-slate-500 text-sm">
          <p>&copy; 2026 WAG POS. Built with ❤️ in Ghana. All rights reserved.</p>
        </div>
      </footer>

      {/* WhatsApp Support Widget */}
      <WhatsAppSupport />
    </div>
  );
}
