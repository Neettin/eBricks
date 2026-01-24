import React, { useState } from 'react';
import { VENDOR } from '../../constants';
import { db } from '../../src/services/firebaseConfig';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface ContactFormData {
  name: string;
  phone: string;
  subject: string;
  message: string;
  email?: string;
}

const Contact: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    phone: '',
    subject: '',
    message: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<ContactFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<ContactFormData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9+\-\s]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.length < 10) {
      newErrors.message = 'Message should be at least 10 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name as keyof ContactFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill all required fields correctly');
      return;
    }

    setIsSubmitting(true);

    try {
      // Save to Firestore
      await addDoc(collection(db, 'contactMessages'), {
        ...formData,
        createdAt: Timestamp.now(),
        status: 'unread',
        read: false,
        replied: false,
        source: 'website_contact_form'
      });

      // Success notification
      toast.success('Message sent successfully! We\'ll get back to you soon.');

      // Reset form
      setFormData({
        name: '',
        phone: '',
        subject: '',
        message: '',
        email: ''
      });
      setErrors({});

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again or call us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      
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
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600">NAME *</label>
                    <input 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full bg-gray-50 border-2 ${errors.name ? 'border-red-300' : 'border-gray-200'} rounded-xl px-4 py-4 focus:border-heritage-gold focus:outline-none transition-colors`}
                      placeholder="Your full name"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600">PHONE *</label>
                    <input 
                      type="tel" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full bg-gray-50 border-2 ${errors.phone ? 'border-red-300' : 'border-gray-200'} rounded-xl px-4 py-4 focus:border-heritage-gold focus:outline-none transition-colors`}
                      placeholder="98XXXXXXXX"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">EMAIL (Optional)</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-4 focus:border-heritage-gold focus:outline-none transition-colors"
                    placeholder="your.email@example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">SUBJECT *</label>
                  <input 
                    type="text" 
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className={`w-full bg-gray-50 border-2 ${errors.subject ? 'border-red-300' : 'border-gray-200'} rounded-xl px-4 py-4 focus:border-heritage-gold focus:outline-none transition-colors`}
                    placeholder="What is this regarding?"
                  />
                  {errors.subject && (
                    <p className="text-red-500 text-sm mt-1">{errors.subject}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">MESSAGE *</label>
                  <textarea 
                    rows={4} 
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    className={`w-full bg-gray-50 border-2 ${errors.message ? 'border-red-300' : 'border-gray-200'} rounded-xl px-4 py-4 focus:border-heritage-gold focus:outline-none transition-colors`}
                    placeholder="Tell us about your project..."
                  />
                  {errors.message && (
                    <p className="text-red-500 text-sm mt-1">{errors.message}</p>
                  )}
                </div>
                
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-brick-900 text-heritage-gold py-5 rounded-2xl font-black text-xl hover:bg-black transition-all shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-heritage-gold border-t-transparent rounded-full animate-spin"></div>
                      SENDING...
                    </>
                  ) : (
                    'SEND MESSAGE'
                  )}
                </button>
                
                <p className="text-xs text-gray-500 text-center">
                  * Required fields. We respect your privacy and will not share your information.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;