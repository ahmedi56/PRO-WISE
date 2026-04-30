export const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

export const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(date);
};

export const formatRating = (rating?: number) => {
    if (rating === undefined || rating === null) return '0.0';
    return rating.toFixed(1);
};

export const truncate = (str?: string, length: number = 100) => {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.slice(0, length) + '...';
};
