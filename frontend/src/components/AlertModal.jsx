// components/AlertModal.jsx
import React from 'react';
import './AlertModal.css';

const AlertModal = ({ isOpen, onClose, title, message, type = 'error' }) => {
    if (!isOpen) return null;

    return (
        <div className="alert-modal-overlay" onClick={onClose}>
            <div className="alert-modal" onClick={(e) => e.stopPropagation()}>
                <div className={`alert-icon ${type}`}>
                    {type === 'error' && '❌'}
                    {type === 'warning' && '⚠️'}
                    {type === 'success' && '✅'}
                    {type === 'info' && 'ℹ️'}
                </div>
                <h3 className="alert-title">{title}</h3>
                <p className="alert-message">{message}</p>
                <button className="alert-btn" onClick={onClose}>
                    OK
                </button>
            </div>
        </div>
    );
};

export default AlertModal;