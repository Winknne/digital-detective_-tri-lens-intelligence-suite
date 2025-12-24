
import React from 'react';

interface Props {
  verdict: 'AUTHENTIC' | 'FRAUDULENT' | 'SUSPICIOUS';
}

const VerdictStamp: React.FC<Props> = ({ verdict }) => {
  const configs = {
    AUTHENTIC: {
      color: 'text-emerald-600 border-emerald-500 bg-emerald-50',
      icon: 'fa-check-circle',
      label: 'Verified Authentic'
    },
    FRAUDULENT: {
      color: 'text-rose-600 border-rose-500 bg-rose-50',
      icon: 'fa-triangle-exclamation',
      label: 'Fraudulent Narrative'
    },
    SUSPICIOUS: {
      color: 'text-amber-600 border-amber-500 bg-amber-50',
      icon: 'fa-circle-info',
      label: 'Anomalous Data'
    }
  };

  const config = configs[verdict];

  return (
    <div className={`
      border-2 rounded-xl px-6 py-3 font-black text-xs uppercase tracking-[0.2em]
      animate-in zoom-in-95 duration-500 flex items-center gap-3
      ${config.color}
    `}>
      <i className={`fa-solid ${config.icon} text-base`}></i>
      {config.label}
    </div>
  );
};

export default VerdictStamp;
