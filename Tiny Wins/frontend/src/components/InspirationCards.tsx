import React from 'react';
import { Heart, ExternalLink, PlayCircle, Music, BookOpen, Quote, Sparkles } from 'lucide-react';

// ==========================================
// 1. INSPIRATION / QUOTE CARD
// ==========================================
interface InspirationCardProps {
  inspiration: {
    id: string;
    text: string;
    author?: string;
    type: string; // 'quote', 'reflection', 'verse', 'saint_quote', 'prompt'
    is_favourite: boolean;
  };
  onFavourite?: () => void;
  showIcon?: boolean;
}

export const InspirationCard: React.FC<InspirationCardProps> = ({
  inspiration,
  onFavourite,
  showIcon = true
}) => {
  const getBadgeStyle = (type: string) => {
    switch (type.toLowerCase()) {
      case 'verse': return 'bg-yellow text-warm-brown-dark bg-opacity-25';
      case 'saint_quote': return 'bg-peach text-warm-brown bg-opacity-30';
      case 'prompt': return 'bg-coral text-white bg-opacity-90';
      case 'reflection': return 'bg-rose text-white bg-opacity-90';
      default: return 'bg-theme-border text-theme-muted';
    }
  };

  return (
    <div className="p-6 rounded-3xl border border-peach border-opacity-30 bg-theme-card relative overflow-hidden shadow-soft-peach fade-in">
      {/* Top soft visual header */}
      <div className="flex justify-between items-start mb-4">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${getBadgeStyle(inspiration.type)}`}>
          {inspiration.type.replace('_', ' ')}
        </span>
        
        {onFavourite && (
          <button 
            onClick={onFavourite}
            className={`transition-all duration-200 active:scale-75 ${inspiration.is_favourite ? 'text-rose scale-110' : 'text-theme-muted hover:text-rose'}`}
          >
            <Heart size={18} fill={inspiration.is_favourite ? 'currentColor' : 'transparent'} />
          </button>
        )}
      </div>

      <div className="relative">
        {showIcon && (
          <Quote className="text-peach text-opacity-30 absolute -top-4 -left-2 rotate-180" size={32} />
        )}
        <p className="text-sm font-medium text-theme-text italic leading-relaxed pt-2">
          “{inspiration.text}”
        </p>
        {inspiration.author && (
          <span className="block text-[11px] font-bold text-theme-muted mt-3 text-right">
            — {inspiration.author}
          </span>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 2. SUPPORT CONTENT CARD
// ==========================================
interface ContentCardProps {
  content: {
    id: string;
    title: string;
    category: string;
    type: string; // 'video', 'playlist', 'song', 'article', 'podcast', 'breathing'
    url: string;
    platform?: string;
    short_description?: string;
    estimated_duration?: string;
    is_favourite: boolean;
  };
  onFavourite?: () => void;
}

export const ContentCard: React.FC<ContentCardProps> = ({ content, onFavourite }) => {
  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'video': return <PlayCircle size={18} />;
      case 'playlist':
      case 'song': return <Music size={18} />;
      case 'breathing': return <Sparkles size={18} />;
      default: return <BookOpen size={18} />;
    }
  };

  const handleOpenLink = () => {
    window.open(content.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="p-4 rounded-2xl border border-theme-border bg-theme-card hover:border-peach transition-all shadow-premium flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-theme-muted uppercase tracking-wider bg-theme-bg px-2.5 py-0.5 rounded-full border border-theme-border">
            {content.category}
          </span>
          
          <div className="flex items-center gap-2">
            {onFavourite && (
              <button 
                onClick={onFavourite}
                className={`transition-all duration-200 active:scale-75 ${content.is_favourite ? 'text-rose scale-110' : 'text-theme-muted hover:text-rose'}`}
              >
                <Heart size={16} fill={content.is_favourite ? 'currentColor' : 'transparent'} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2.5 mt-3">
          <span className="text-coral bg-peach bg-opacity-20 p-2 rounded-xl flex-shrink-0 mt-0.5">
            {getIcon(content.type)}
          </span>
          <div>
            <h4 className="text-sm font-bold text-theme-text line-clamp-1">{content.title}</h4>
            <span className="text-[10px] text-theme-muted">{content.platform || 'Website'} • {content.estimated_duration || '5m'}</span>
          </div>
        </div>

        {content.short_description && (
          <p className="text-xs text-theme-muted mt-2 line-clamp-2 leading-relaxed">
            {content.short_description}
          </p>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-theme-border border-opacity-40 flex items-center justify-between">
        <span className="text-[9px] text-theme-muted italic">Support links open outside TinyWins</span>
        <button
          onClick={handleOpenLink}
          className="py-1 px-3 bg-peach bg-opacity-40 hover:bg-peach text-warm-brown text-xs font-bold rounded-xl flex items-center gap-1 transition-all active:scale-95"
        >
          Open <ExternalLink size={12} />
        </button>
      </div>
    </div>
  );
};
