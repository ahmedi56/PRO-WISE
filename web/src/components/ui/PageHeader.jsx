import React from 'react';

const PageHeader = ({ title, subtitle, actions }) => (
    <div className="page-header page-header-stacked-mobile">
        <div className="page-header-copy">
            <h2>{title}</h2>
            {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
        </div>
        {actions ? <div className="page-header-actions">{actions}</div> : null}
    </div>
);

export default PageHeader;