import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';

const InstagramIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Contact Customer Support</h1>
        <p className="text-slate-500 text-sm">We are here to help you with order inquiries, tracking, and product queries</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-xs">
            <div className="p-3 bg-sky-100 text-sky-700 rounded-xl">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Phone / WhatsApp</h4>
              <p className="text-sm font-extrabold text-slate-800">
                <a href="tel:+917718862274" className="hover:text-sky-600 transition">+91 7718862274</a>
              </p>
              <a href="https://wa.me/917718862274" target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-emerald-600 hover:underline">
                Chat on WhatsApp →
              </a>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-xs">
            <div className="p-3 bg-sky-100 text-sky-700 rounded-xl">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Email Us</h4>
              <p className="text-sm font-extrabold text-slate-800">
                <a href="mailto:trendytoys.info@gmail.com" className="hover:text-sky-600 transition">trendytoys.info@gmail.com</a>
              </p>
              <span className="text-[11px] text-slate-400">Response within 24 hours</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-xs">
            <div className="p-3 bg-pink-100 text-pink-600 rounded-xl">
              <InstagramIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Instagram</h4>
              <p className="text-sm font-extrabold text-pink-600">
                <a href="https://instagram.com/jgrl_co" target="_blank" rel="noopener noreferrer" className="hover:underline">@jgrl_co</a>
              </p>
              <span className="text-[11px] text-slate-400">Follow for updates & new toys</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-xs">
            <div className="p-3 bg-sky-100 text-sky-700 rounded-xl">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Store & Fulfillment Center</h4>
              <p className="text-xs text-slate-600 font-semibold leading-snug">
                Versova, Yari Road, Near D Mart, Andheri West, Mumbai - 400061
              </p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          {submitted ? (
            <div className="text-center py-12 space-y-3">
              <MessageSquare className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-xl font-bold text-slate-900">Message Sent Successfully!</h3>
              <p className="text-xs text-slate-500">Our customer support representative will get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="font-extrabold text-slate-900 text-base">Send Us a Direct Message</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Rahul Sharma"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 9876543210"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="rahul@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Message / Order ID</label>
                <textarea
                  required
                  rows={4}
                  placeholder="How can we assist you today?"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                ></textarea>
              </div>

              <button
                type="submit"
                className="bg-navy-gradient text-white font-extrabold px-6 py-3 rounded-xl text-xs shadow-md transition flex items-center gap-2"
              >
                <Send className="w-4 h-4" /> Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
