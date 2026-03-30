import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InputField from './ui/InputField';

const SemanticSearch = ({ variant = 'default' }) => {
    const [query, setQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e) => {
        if (e.key === 'Enter' && query.trim()) {
            navigate(`/search?q=${encodeURIComponent(query.trim())}`);
            setQuery('');
        }
    };

    const handleButtonClick = () => {
        if (query.trim()) {
            navigate(`/search?q=${encodeURIComponent(query.trim())}`);
            setQuery('');
        }
    };

    return (
        <div className={`semantic-search-container ${variant}`}>
            <div className="search-input-wrapper">
                <ion-icon name="search-outline" className="search-icon"></ion-icon>
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search products semantically..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleSearch}
                />
                <button 
                    className="search-submit-btn" 
                    onClick={handleButtonClick}
                    aria-label="Search"
                >
                    <ion-icon name="arrow-forward-outline"></ion-icon>
                </button>
            </div>
        </div>
    );
};

export default SemanticSearch;
