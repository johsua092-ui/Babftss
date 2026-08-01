import { MessageCircle } from 'lucide-react';

export default function AIHelperButton({ onClick }) {
    return (
        <button
            style={{
                position: 'fixed', bottom: 24, right: 24, zIndex: 200,
                width: 52, height: 52, borderRadius: '50%',
                backgroundColor: '#334155', border: '1px solid #475569',
                color: '#e2e8f0', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                transition: 'background-color 0.2s, transform 0.15s',
            }}
            onClick={onClick}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#475569'; e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#334155'; e.currentTarget.style.transform = 'scale(1)'; }}
            title="AI Helper"
        >
            <MessageCircle size={22} />
        </button>
    );
}
