import { cn } from '../utils';

const masters = [
  { id: 'huiming', emoji: '🧘', name: '慧明长老', title: '古寺住持', style: '庄重持重，引经据典', desc: '通读《渊海子平》《滴天髓》，言语稳重克制。适合希望深度解读、看古籍出处的施主。' },
  { id: 'mingxin', emoji: '🙏', name: '明心师父', title: '尼众法师', style: '慈悲温柔，劝人向善', desc: '语调温和，慈悲为怀。适合家庭、感情、亲人祈福场景。' },
  { id: 'xuanzhen', emoji: '☯️', name: '玄真道长', title: '山中道人', style: '直爽通透，说大白话', desc: '山中道人，不爱绕弯子。把命理讲成大白话，适合急性子。' },
];

export function MasterSelector({ selected, onChange }) {
  return (
    <section>
      <h3 className="font-display text-lg text-gold mb-3 text-center">请选一位师父为您开示</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {masters.map(m => {
          const active = selected === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(m.id)}
              className={cn(
                'rounded-xl border p-4 text-left transition-all duration-fast text-sm',
                active
                  ? 'border-gold/60 bg-gold/10 shadow-lg shadow-gold/5'
                  : 'border-gold/20 bg-xuan-card/80 hover:border-gold/40'
              )}
            >
              <div className="text-2xl mb-2">{m.emoji}</div>
              <div className="font-display text-base text-gold">{m.name}</div>
              <div className="text-xs text-paper-dark/60 mb-1">{m.title}</div>
              <div className="text-xs text-paper-dark/80 mb-1.5">{m.style}</div>
              <div className="text-xs text-paper-dark/50 leading-relaxed">{m.desc}</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
