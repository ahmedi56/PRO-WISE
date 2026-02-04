import React, { useState } from 'react';

function App() {
    const [count, setCount] = useState(0);

    return (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h1>Product Assistant Web</h1>
            <p>Sprint 0 Setup Complete</p>
            <button onClick={() => setCount(c => c + 1)}>count is {count}</button>
        </div>
    );
}

export default App;
