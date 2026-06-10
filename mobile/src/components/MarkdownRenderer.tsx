import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

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
    style?: any;
    textStyle?: any;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ text, style, textStyle }) => {
    if (!text) return null;
    const blocks = parseMarkdown(text);

    const renderInline = (segments?: Array<{ text: string; isBold: boolean }>) => {
        if (!segments) return null;
        return segments.map((seg, idx) => (
            <Text key={idx} style={seg.isBold ? [styles.bold, textStyle] : textStyle}>
                {seg.text}
            </Text>
        ));
    };

    return (
        <View style={[styles.container, style]}>
            {blocks.map((block, bIdx) => {
                switch (block.type) {
                    case 'h1':
                        return (
                            <Text key={bIdx} style={[styles.h1, textStyle, { fontWeight: 'bold' }]}>
                                {renderInline(block.content)}
                            </Text>
                        );
                    case 'h2':
                        return (
                            <Text key={bIdx} style={[styles.h2, textStyle, { fontWeight: 'bold' }]}>
                                {renderInline(block.content)}
                            </Text>
                        );
                    case 'h3':
                        return (
                            <Text key={bIdx} style={[styles.h3, textStyle, { fontWeight: 'bold' }]}>
                                {renderInline(block.content)}
                            </Text>
                        );
                    case 'h4':
                        return (
                            <Text key={bIdx} style={[styles.h4, textStyle, { fontWeight: 'bold' }]}>
                                {renderInline(block.content)}
                            </Text>
                        );
                    case 'ul':
                        return (
                            <View key={bIdx} style={styles.listContainer}>
                                {block.items?.map((item, iIdx) => (
                                    <View key={iIdx} style={styles.listItemRow}>
                                        <Text style={[styles.bullet, textStyle]}>•</Text>
                                        <Text style={[styles.listItemText, textStyle]}>{renderInline(item)}</Text>
                                    </View>
                                ))}
                            </View>
                        );
                    case 'ol':
                        return (
                            <View key={bIdx} style={styles.listContainer}>
                                {block.items?.map((item, iIdx) => (
                                    <View key={iIdx} style={styles.listItemRow}>
                                        <Text style={[styles.bullet, textStyle]}>{iIdx + 1}.</Text>
                                        <Text style={[styles.listItemText, textStyle]}>{renderInline(item)}</Text>
                                    </View>
                                ))}
                            </View>
                        );
                    case 'p':
                    default:
                        return (
                            <Text key={bIdx} style={[styles.p, textStyle]}>
                                {renderInline(block.content)}
                            </Text>
                        );
                }
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
    },
    bold: {
        fontWeight: 'bold',
    },
    h1: {
        fontSize: 20,
        fontWeight: 'bold',
        marginVertical: 6,
        color: '#f8fafc',
    },
    h2: {
        fontSize: 18,
        fontWeight: 'bold',
        marginVertical: 5,
        color: '#f8fafc',
    },
    h3: {
        fontSize: 16,
        fontWeight: 'bold',
        marginVertical: 4,
        color: '#f8fafc',
    },
    h4: {
        fontSize: 14,
        fontWeight: 'bold',
        marginVertical: 3,
        color: '#f8fafc',
    },
    p: {
        fontSize: 14,
        lineHeight: 21,
        color: '#cbd5e1',
        marginVertical: 4,
    },
    listContainer: {
        marginVertical: 4,
        paddingLeft: 4,
    },
    listItemRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginVertical: 3,
    },
    bullet: {
        fontSize: 14,
        color: '#64748b',
        width: 16,
        textAlign: 'left',
        marginRight: 4,
    },
    listItemText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 21,
        color: '#cbd5e1',
    },
});

export default MarkdownRenderer;
