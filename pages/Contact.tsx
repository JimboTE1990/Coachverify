
import React, { useState } from 'react';
import { Mail, MessageSquare, Send } from 'lucide-react';

export const Contact: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Get in touch</h1>
          <p className="mt-4 text-slate-500">
            Whether you are a client looking for help or a coach needing support, we are here for you.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                  <input required type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                  <input required type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input required type="email" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white">
                  <option>General Inquiry</option>
                  <option>I'm a Coach having trouble</option>
                  <option>Billing Support</option>
                  <option>Report a Profile</option>
                  <option>Account Deletion Request</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                <textarea required rows={4} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="How can we help?"></textarea>
              </div>

              <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-md flex justify-center items-center">
                <Send className="h-4 w-4 mr-2" /> Send Message
              </button>
            </form>
          ) : (
            <div className="text-center py-10">
              <div className="bg-green-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Message Sent!</h2>
              <p className="text-slate-500">We'll get back to you within 24 hours.</p>
              <button onClick={() => setSubmitted(false)} className="mt-6 text-brand-600 font-medium hover:underline">Send another message</button>
            </div>
          )}

          <div className="mt-10 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Direct Email Support: <a href="mailto:accounts@coachdog.com" className="text-brand-600 font-medium hover:underline">accounts@coachdog.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};