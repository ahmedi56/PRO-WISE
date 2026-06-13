import re

def strip_latex(file_path, output_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Remove LaTeX comments
    content = re.sub(r'(?<!\\)%.*', '', content)

    # 2. Remove front matter and preamble (everything before \begin{document})
    if '\\begin{document}' in content:
        content = content.split('\\begin{document}', 1)[1]
    if '\\end{document}' in content:
        content = content.split('\\end{document}', 1)[0]

    # 3. Remove standard environments completely (figures, tables, tikzpictures, longtables, listings)
    environments_to_remove = ['figure', 'table', 'tikzpicture', 'longtable', 'tabular', 'lstlisting']
    for env in environments_to_remove:
        # Match \begin{env} ... \end{env} spanning multiple lines (non-greedy)
        pattern = re.compile(r'\\begin\{' + env + r'\}.*?\\end\{' + env + r'\}', re.DOTALL)
        content = pattern.sub('', content)

    # 4. Remove standalone commands but keep their inner text (e.g., \textbf{Text} -> Text)
    # Match \command{text} recursively or simply
    # We do a few passes for nested brackets
    for _ in range(3):
        content = re.sub(r'\\(?:textbf|textit|texttt|section|subsection|chapter|paragraph|chapter\*|section\*|subsection\*)\{([^{}]+)\}', r'\1', content)

    # 5. Remove commands entirely (e.g., \cite{...}, \ref{...}, \label{...}, \vspace{...}, \hspace{...}, \includegraphics{...})
    content = re.sub(r'\\(?:cite|ref|label|vspace|hspace|includegraphics|bibliographystyle|bibliography|addcontentsline|pagenumbering|thispagestyle|cleardoublepage|linespread|selectfont|large|Large|LARGE|small|footnotesize|vfill|hfill)[\{\[].*?[\}\]]', '', content)
    content = re.sub(r'\\(?:cite|ref|label|vspace|hspace|includegraphics|bibliographystyle|bibliography|addcontentsline|pagenumbering|thispagestyle|cleardoublepage|linespread|selectfont|large|Large|LARGE|small|footnotesize|vfill|hfill)', '', content)

    # 6. Clean up simple LaTeX symbols
    content = content.replace('\\\\', '\n')
    content = content.replace('~', ' ')
    content = content.replace('\\_', '_')
    content = content.replace('\\&', '&')
    content = content.replace('\\%', '%')
    content = content.replace('``', '"')
    content = content.replace("''", '"')

    # 7. Clean up extra whitespace and empty lines
    lines = content.split('\n')
    cleaned_lines = []
    for line in lines:
        stripped = line.strip()
        if stripped:
            cleaned_lines.append(stripped)
    
    final_text = '\n\n'.join(cleaned_lines)

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(final_text)

if __name__ == '__main__':
    strip_latex('main.tex', 'main_plain.txt')
    print("Successfully created main_plain.txt!")
