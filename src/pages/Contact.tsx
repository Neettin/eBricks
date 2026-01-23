
import React from 'react';
import { VENDOR } from '../../constants';

const Contact: React.FC = () => {
  return (
    <div className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <span className="text-heritage-gold font-black uppercase tracking-widest text-sm">Get in Touch</span>
            <h1 className="text-6xl font-oswald font-bold text-brick-900 mt-4 mb-8 uppercase">Let's Build Together</h1>
            <p className="text-xl text-gray-500 font-mukta mb-12 leading-relaxed">
              Have questions about your construction project? Sachin Gupta and our team are ready to provide expert advice and the best brick quotes in Nepal.
            </p>

            <div className="space-y-8">
              <div className="flex gap-6 items-center">
                <div className="bg-brick-800 text-heritage-gold w-16 h-16 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-lg">
                  <i className="fas fa-phone"></i>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Call Us Directly</h4>
                  <p className="text-2xl font-bold text-gray-800">{VENDOR.phone}</p>
                </div>
              </div>
              <div className="flex gap-6 items-center">
                <div className="bg-green-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-lg">
                  <i className="fab fa-whatsapp"></i>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">WhatsApp Chat</h4>
                  <p className="text-2xl font-bold text-gray-800">{VENDOR.whatsapp}</p>
                </div>
              </div>
              <div className="flex gap-6 items-center">
                <div className="bg-heritage-gold text-brick-900 w-16 h-16 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-lg">
                  <i className="fas fa-map-marker-alt"></i>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Our Factory</h4>
                  <p className="text-2xl font-bold text-gray-800">Kathmandu, Nepal</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-gray-100">
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">NAME</label>
                  <input type="text" className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-4 focus:border-heritage-gold focus:outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">PHONE</label>
                  <input type="tel" className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-4 focus:border-heritage-gold focus:outline-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">SUBJECT</label>
                <input type="text" className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-4 focus:border-heritage-gold focus:outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">MESSAGE</label>
                <textarea rows={4} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-4 focus:border-heritage-gold focus:outline-none"></textarea>
              </div>
              <button type="button" className="w-full bg-brick-900 text-heritage-gold py-5 rounded-2xl font-black text-xl hover:bg-black transition-all shadow-xl">
                SEND MESSAGE
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
