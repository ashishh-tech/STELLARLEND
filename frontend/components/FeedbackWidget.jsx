'use client';

import { useState, useEffect } from 'react';

export default function FeedbackWidget({ isOpen, onClose }) {
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState('UX Improvement');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [feedbackHistory, setFeedbackHistory] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('stellarlend_feedback');
      if (stored) {
        setFeedbackHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Could not read local feedback', e);
    }
  }, []);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newFeedback = {
      id: Date.now(),
      rating,
      category,
      message,
      timestamp: new Date().toISOString(),
    };

    const updated = [newFeedback, ...feedbackHistory];
    setFeedbackHistory(updated);
    try {
      localStorage.setItem('stellarlend_feedback', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setMessage('');
      onClose();
    }, 2000);
  };

  const CATEGORIES = ['Feature Request', 'Bug Report', 'UX Improvement', 'Smart Contract Safety'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-navy-900/95 border border-white/15 rounded-2xl shadow-2xl p-6 md:p-8 overflow-hidden">
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-brand-emerald to-cyan-400" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">rate_review</span>
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-purple-400 font-semibold">
                Continuous Product Iteration
              </span>
              <h3 className="text-lg font-headline font-bold text-white leading-tight">
                Community Feedback Loop
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {submitted ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-brand-emerald/20 text-brand-emerald flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">task_alt</span>
            </div>
            <h4 className="text-base font-headline font-bold text-white">Thank You for Your Feedback!</h4>
            <p className="text-xs text-slate-300">
              Your feedback fuels our rapid product iteration cycle and directly shapes upcoming Stellar smart contract releases.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Help us iterate and improve StellarLend. Tell us what you loved, what broke, or what features you want next.
            </p>

            {/* Star Rating */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Overall Experience Rating
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 text-2xl transition-transform hover:scale-110 focus:outline-none"
                  >
                    <span
                      className={`material-symbols-outlined ${
                        star <= rating ? 'text-amber-400 font-variation-fill' : 'text-slate-600'
                      }`}
                    >
                      star
                    </span>
                  </button>
                ))}
                <span className="ml-2 text-xs font-mono text-amber-400 font-bold">
                  {rating} / 5 Stars
                </span>
              </div>
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold font-headline transition-all text-left flex items-center gap-1.5 ${
                      category === cat
                        ? 'bg-purple-500/25 border border-purple-400 text-purple-200'
                        : 'bg-navy-950/60 border border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span>{cat}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback text */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Your Insights or Suggestions
              </label>
              <textarea
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your thoughts on lending speed, UX, liquidity, or Soroban integration..."
                className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-purple-400/50 resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-90 text-white font-headline font-bold text-xs transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] flex items-center gap-1.5"
              >
                <span>Submit Feedback</span>
                <span className="material-symbols-outlined text-[16px]">send</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
