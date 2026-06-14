import { motion } from 'framer-motion';

export default function RoleCard({ icon, title, description, highlights, onClick, roleKey }) {
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 15 }
    },
    hover: { 
      y: -8,
      scale: 1.02,
      borderColor: 'rgba(82, 183, 136, 0.6)',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25), 0 0 20px rgba(82, 183, 136, 0.15)',
      transition: { duration: 0.3 }
    }
  };

  const glowColors = {
    farmer: 'rgba(45, 106, 79, 0.4)',
    fpo: 'rgba(82, 183, 136, 0.4)',
    aggregator: 'rgba(27, 92, 107, 0.4)',
    market_partner: 'rgba(181, 98, 10, 0.4)'
  };

  const accentColor = glowColors[roleKey] || 'rgba(82, 183, 136, 0.4)';

  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      onClick={onClick}
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(12px) saturate(110%)',
        WebkitBackdropFilter: 'blur(12px) saturate(110%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        padding: '30px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        minHeight: '380px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.3s, box-shadow 0.3s',
      }}
    >
      <div 
        style={{
          position: 'absolute',
          top: '-20%',
          right: '-20%',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: accentColor,
          filter: 'blur(50px)',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '30px',
          marginBottom: '20px',
          boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.05)'
        }}>
          {icon}
        </div>

        <h3 style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '20px',
          fontWeight: '600',
          color: '#ffffff',
          marginBottom: '10px'
        }}>
          {title}
        </h3>

        <p style={{
          fontSize: '13px',
          lineHeight: '1.6',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '20px',
          fontWeight: '400'
        }}>
          {description}
        </p>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          marginBottom: '24px'
        }}>
          {highlights.map((item, index) => (
            <span key={index} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 10px',
              background: 'rgba(82, 183, 136, 0.1)',
              border: '1px solid rgba(82, 183, 136, 0.2)',
              borderRadius: '100px',
              fontSize: '11px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.65)'
            }}>
              ✓ {item}
            </span>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <button style={{
          width: '100%',
          padding: '11px 20px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)',
          border: '1px solid rgba(82, 183, 136, 0.3)',
          color: '#ffffff',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 12px rgba(45, 106, 79, 0.2)'
        }}>
          <span>Continue to Login</span>
          <span>→</span>
        </button>
      </div>
    </motion.div>
  );
}
