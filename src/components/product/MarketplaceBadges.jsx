import React from 'react';
import { ExternalLink, ShoppingBag } from 'lucide-react';

export default function MarketplaceBadges({ amazonUrl, flipkartUrl, meeshoUrl }) {
  const hasLinks = Boolean(amazonUrl || flipkartUrl || meeshoUrl);
  if (!hasLinks) return null;

  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
        <ShoppingBag className="w-3.5 h-3.5 text-sky-600" />
        <span>Also Available On Marketplaces</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {amazonUrl && (
          <a
            href={amazonUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300/60 rounded-xl text-xs font-bold transition"
          >
            <span>Amazon</span>
            <ExternalLink className="w-3 h-3 text-amber-700" />
          </a>
        )}

        {flipkartUrl && (
          <a
            href={flipkartUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-900 border border-blue-300/60 rounded-xl text-xs font-bold transition"
          >
            <span>Flipkart</span>
            <ExternalLink className="w-3 h-3 text-blue-700" />
          </a>
        )}

        {meeshoUrl && (
          <a
            href={meeshoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500/10 hover:bg-pink-500/20 text-pink-900 border border-pink-300/60 rounded-xl text-xs font-bold transition"
          >
            <span>Meesho</span>
            <ExternalLink className="w-3 h-3 text-pink-700" />
          </a>
        )}
      </div>
    </div>
  );
}
