import React from 'react';

interface ModalProps {
    title?: string;
    children: React.ReactNode;
    onClose: () => void;
    actions?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ title, children, onClose, actions }) => (
    <div className="overlay" onClick={onClose} style={{ zIndex: 1000 }}>
        <div className="dialog" onClick={(event) => event.stopPropagation()}>
            {title ? <div className="dialog-title">{title}</div> : null}
            <div className="dialog-text modal-body">{children}</div>
            {actions ? <div className="dialog-actions">{actions}</div> : null}
        </div>
    </div>
);

export default Modal;
