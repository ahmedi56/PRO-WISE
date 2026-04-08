import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface SemanticSearchProps {
    variant?: 'default' | 'large' | 'compact';
}

const SemanticSearch: React.FC<SemanticSearchProps> = ({ variant = 'default' }) => {
    const [query, setQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
                <ion-icon name="search-outline" class="search-icon"></ion-icon>
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
