import React from 'react';

const Spinner = ({ overlay = false }) => {
    const content = (
        <div className="spinner-box">
            <div className="circle-border">
                <div className="circle-core"></div>
            </div>
        </div>
    );

    if (overlay) {
        return (
            <div className="loading-overlay">
                {content}
            </div>
        );
    }

    return content;
};

export default Spinner;
