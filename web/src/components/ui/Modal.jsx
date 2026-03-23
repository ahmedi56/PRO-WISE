import React from 'react';

const Modal = ({ title, children, onClose, actions }) => (
    <div className="overlay" onClick={onClose}>
        <div className="dialog" onClick={(event) => event.stopPropagation()}>
            {title ? <div className="dialog-title">{title}</div> : null}
            <div className="dialog-text modal-body">{children}</div>
            {actions ? <div className="dialog-actions">{actions}</div> : null}
        </div>
    </div>
);

export default Modal;