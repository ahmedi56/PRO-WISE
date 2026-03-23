import React from 'react';
import { Link } from 'react-router-dom';
import AdminProductTable from '../components/AdminProductTable';
import { Button, PageHeader } from '../components/ui';

const AdminPage = () => {
    return (
        <div className="page">
            

            <AdminProductTable />
        </div>
    );
};

export default AdminPage;
