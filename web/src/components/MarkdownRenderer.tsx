import React from 'react';

interface MarkdownBlock {
    type: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'ul' | 'ol';
    items?: Array<{ text: string; isBold: boolean }[]>;
    content?: Array<{ text: string; isBold: boolean }>;
}

function parseInlineStyles(text: string): Array<{ text: string; isBold: boolean }> {
    const parts: Array<{ text: string; isBold: boolean }> = [];
    const regex = /\*\*([\s\S]*?)\*\*/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push({ text: text.substring(lastIndex, match.index), isBold: false });
        }
        parts.push({ text: match[1], isBold: true });
        lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
        parts.push({ text: text.substring(lastIndex), isBold: false });
    }
    return parts;
}

function parseMarkdown(text: string): MarkdownBlock[] {
    const lines = text.split(/\r?\n/);
    const blocks: MarkdownBlock[] = [];
    let currentList: { type: 'ul' | 'ol'; items: Array<{ text: string; isBold: boolean }[]> } | null = null;

    const commitList = () => {
        if (currentList) {
            blocks.push({
                type: currentList.type,
                items: currentList.items
            });
            currentList = null;
        }
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // 1. Empty lines
        if (trimmed === '') {
            commitList();
            continue;
        }

        // 2. Headings
        const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
        if (headingMatch) {
            commitList();
            const level = headingMatch[1].length;
            const headingText = headingMatch[2];
            const type = level === 1 ? 'h1' : level === 2 ? 'h2' : level === 3 ? 'h3' : 'h4';
            blocks.push({
                type,
                content: parseInlineStyles(headingText)
            });
            continue;
        }

        // 3. Bullet lists (e.g. * item, - item)
        const bulletMatch = line.match(/^(\s*)[*+-]\s+(.*)$/);
        if (bulletMatch) {
            const listText = bulletMatch[2];
            const parsedItem = parseInlineStyles(listText);
            if (currentList && currentList.type === 'ul') {
                currentList.items.push(parsedItem);
            } else {
                commitList();
                currentList = {
                    type: 'ul',
                    items: [parsedItem]
                };
            }
            continue;
        }

        // 4. Numbered lists (e.g. 1. item)
        const numberMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
        if (numberMatch) {
            const listText = numberMatch[2];
            const parsedItem = parseInlineStyles(listText);
            if (currentList && currentList.type === 'ol') {
                currentList.items.push(parsedItem);
            } else {
                commitList();
                currentList = {
                    type: 'ol',
                    items: [parsedItem]
                };
            }
            continue;
        }

        // 5. Paragraphs (plain text lines)
        commitList();
        const parsedLine = parseInlineStyles(line);
        if (blocks.length > 0 && blocks[blocks.length - 1].type === 'p') {
            const lastBlock = blocks[blocks.length - 1];
            if (lastBlock.content) {
                lastBlock.content.push({ text: '\n', isBold: false });
                lastBlock.content.push(...parsedLine);
            }
        } else {
            blocks.push({
                type: 'p',
                content: parsedLine
            });
        }
    }

    commitList();
    return blocks;
}

interface MarkdownRendererProps {
    text: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ text }) => {
    if (!text) return null;
    const blocks = parseMarkdown(text);

    const renderInline = (segments?: Array<{ text: string; isBold: boolean }>) => {
        if (!segments) return null;
        return segments.map((seg, idx) => 
            seg.isBold ? <strong key={idx}>{seg.text}</strong> : <span key={idx}>{seg.text}</span>
        );
    };

    return (
        <div className="markdown-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {blocks.map((block, bIdx) => {
                switch (block.type) {
                    case 'h1':
                        return <h1 key={bIdx} style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0.4rem 0', color: 'var(--color-text-strong)' }}>{renderInline(block.content)}</h1>;
                    case 'h2':
                        return <h2 key={bIdx} style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.3rem 0', color: 'var(--color-text-strong)' }}>{renderInline(block.content)}</h2>;
                    case 'h3':
                        return <h3 key={bIdx} style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.2rem 0', color: 'var(--color-text-strong)' }}>{renderInline(block.content)}</h3>;
                    case 'h4':
                        return <h4 key={bIdx} style={{ fontSize: '1rem', fontWeight: 700, margin: '0.15rem 0', color: 'var(--color-text-strong)' }}>{renderInline(block.content)}</h4>;
                    case 'ul':
                        return (
                            <ul key={bIdx} style={{ paddingLeft: '1.25rem', margin: '0.15rem 0', listStyleType: 'disc' }}>
                                {block.items?.map((item, iIdx) => (
                                    <li key={iIdx} style={{ marginBottom: '0.2rem' }}>{renderInline(item)}</li>
                                ))}
                            </ul>
                        );
                    case 'ol':
                        return (
                            <ol key={bIdx} style={{ paddingLeft: '1.25rem', margin: '0.15rem 0', listStyleType: 'decimal' }}>
                                {block.items?.map((item, iIdx) => (
                                    <li key={iIdx} style={{ marginBottom: '0.2rem' }}>{renderInline(item)}</li>
                                ))}
                            </ol>
                        );
                    case 'p':
                    default:
                        return <p key={bIdx} style={{ margin: 0, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{renderInline(block.content)}</p>;
                }
            })}
        </div>
    );
};

export default MarkdownRenderer;
