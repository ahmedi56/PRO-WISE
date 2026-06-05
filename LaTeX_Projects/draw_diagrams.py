import matplotlib.pyplot as plt
import matplotlib.patches as patches
import os

# Create brain/artifacts directory if not exists
output_dir = r"C:\Users\T560\.gemini\antigravity\brain\b6cedd80-4cdf-44f0-973f-81456fda08c4"
os.makedirs(output_dir, exist_ok=True)

def draw_compatibility_flowchart():
    fig, ax = plt.subplots(figsize=(10, 11), dpi=200)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 11)
    ax.axis('off')
    
    # Title
    ax.text(5, 10.5, "HYBRID SPARE PARTS COMPATIBILITY\nSYSTEM FLOWCHART", 
            ha='center', va='center', fontsize=16, fontweight='bold', color='#1A5F7A')
    
    # Define box drawing helpers
    def draw_box(x, y, w, h, text, box_style="round,pad=0.3", fc="#1A5F7A", ec="none", tc="white", fs=10, fw="normal"):
        bbox = dict(boxstyle=box_style, fc=fc, ec=ec, lw=1.5)
        ax.text(x, y, text, ha='center', va='center', fontsize=fs, fontweight=fw, color=tc, bbox=bbox)

    # 1. Query Input
    draw_box(5, 9.4, 3, 0.6, "Query Input\n(Part Name, Model, Details)", fc="#2F4858", tc="white", fw="bold")
    
    # 2. Candidate Retrieval
    draw_box(3.2, 8.2, 3, 0.6, "Candidate Parts Retrieval\n(Fetch from database)", fc="#eef4f8", ec="#1A5F7A", tc="#2F4858")
    draw_box(7.2, 8.2, 1.8, 0.6, "MongoDB\nDatabase", box_style="square,pad=0.4", fc="#d1e3ed", ec="#2F4858", tc="#2F4858", fw="bold")
    
    # 3. Stage 1 Header
    rect1 = patches.FancyBboxPatch((1.5, 5.0), 7.0, 2.2, boxstyle="round,pad=0.2", fc="#f4f8fa", ec="#1A5F7A", lw=2)
    ax.add_patch(rect1)
    ax.text(5, 7.0, "STAGE 1: SEMANTIC FILTERING", ha='center', va='center', fontsize=11, fontweight='bold', color='#1A5F7A')
    
    draw_box(5, 6.2, 5, 0.5, "Evaluate Relevance Score via Gemini API", fc="white", ec="#1A5F7A", tc="#2F4858")
    
    # Decision 1
    # Diamond coordinates
    def draw_diamond(x, y, w, h, text, fc="#fff3e0", ec="#e65100", tc="#2F4858"):
        p = patches.Polygon([[x-w/2, y], [x, y+h/2], [x+w/2, y], [x, y-h/2]], closed=True, fc=fc, ec=ec, lw=1.5)
        ax.add_patch(p)
        ax.text(x, y, text, ha='center', va='center', fontsize=9, fontweight="bold", color=tc)

    draw_diamond(5, 4.3, 2.2, 1.2, "Relevance\nScore >= 0.7?")
    
    # Rejected Cloud
    draw_box(8.5, 4.3, 2, 0.5, "Rejected /\nIncompatible", fc="#ffebee", ec="#ef5350", tc="#c62828", fw="bold")
    
    # Stage 2 Header
    rect2 = patches.FancyBboxPatch((1.5, 1.2), 7.0, 2.2, boxstyle="round,pad=0.2", fc="#fcf8f2", ec="#e65100", lw=2)
    ax.add_patch(rect2)
    ax.text(5, 3.2, "STAGE 2: DETERMINISTIC CHECKS", ha='center', va='center', fontsize=11, fontweight='bold', color='#e65100')
    
    draw_diamond(3.0, 2.1, 1.8, 1.0, "Brand\nMatching?")
    draw_diamond(5.0, 2.1, 1.8, 1.0, "Socket\nMatching?")
    draw_diamond(7.0, 2.1, 1.8, 1.0, "Interface\nSpecs?")
    
    # Rejected 2
    draw_box(8.5, 2.1, 2, 0.5, "Rejected /\nIncompatible", fc="#ffebee", ec="#ef5350", tc="#c62828", fw="bold")
    
    # Accepted Output
    draw_box(5, 0.5, 4, 0.6, "Accepted & Ranked Outputs\n(Validated & Sorted Parts)", fc="#e8f5e9", ec="#2e7d32", tc="#1b5e20", fw="bold")
    
    # Draw arrows helper
    def draw_arrow(x1, y1, x2, y2, text="", text_pos=None):
        ax.annotate(text, xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle="->", lw=1.5, color="#546e7a"),
                    ha='center', va='center', fontsize=9, color="#37474f")

    # Connecting arrows
    draw_arrow(5, 9.1, 5, 8.6)
    draw_arrow(4.6, 8.2, 6.2, 8.2)
    draw_arrow(6.2, 8.2, 4.6, 8.2)
    draw_arrow(5, 7.8, 5, 7.3)
    draw_arrow(5, 5.9, 5, 5.0)
    draw_arrow(6.2, 4.3, 7.5, 4.3, "No", (6.8, 4.5))
    draw_arrow(5, 3.7, 5, 3.5, "Yes", (4.8, 3.6))
    
    draw_arrow(3.9, 2.1, 4.1, 2.1, "Yes")
    draw_arrow(5.9, 2.1, 6.1, 2.1, "Yes")
    draw_arrow(7.9, 2.1, 7.5, 2.1, "No") # Arrow from Interface to reject
    
    # Arrows from decisions to reject
    ax.annotate("No", xy=(7.5, 2.1), xytext=(3.0, 1.6), arrowprops=dict(arrowstyle="->", connectionstyle="arc3,rad=-0.2", color="#546e7a"))
    ax.annotate("No", xy=(7.5, 2.1), xytext=(5.0, 1.6), arrowprops=dict(arrowstyle="->", connectionstyle="arc3,rad=-0.2", color="#546e7a"))
    
    draw_arrow(7.0, 1.6, 5.0, 0.9, "Yes")
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "hybrid_parts_compatibility.png"), bbox_inches='tight')
    plt.close()

def draw_rag_pipeline():
    fig, ax = plt.subplots(figsize=(10, 7.5), dpi=200)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7.5)
    ax.axis('off')
    
    # Title
    ax.text(5, 7.1, "RETRIEVAL-AUGMENTED GENERATION (RAG) PIPELINE", 
            ha='center', va='center', fontsize=14, fontweight='bold', color='#1A5F7A')
    
    # Helpers
    def draw_box(x, y, w, h, text, fc="#1A5F7A", ec="none", tc="white", fs=9, fw="normal"):
        bbox = dict(boxstyle="round,pad=0.3", fc=fc, ec=ec, lw=1.2)
        ax.text(x, y, text, ha='center', va='center', fontsize=fs, fontweight=fw, color=tc, bbox=bbox)

    def draw_db(x, y, text, fc="#d1e3ed", ec="#2F4858"):
        bbox = dict(boxstyle="square,pad=0.4", fc=fc, ec=ec, lw=1.2)
        ax.text(x, y, text, ha='center', va='center', fontsize=9, fontweight="bold", color="#2F4858", bbox=bbox)

    # INDEXING PHASE
    rect1 = patches.FancyBboxPatch((0.2, 3.8), 9.6, 2.4, boxstyle="round,pad=0.1", fc="#f7f9fa", ec="#1A5F7A", lw=1.5)
    ax.add_patch(rect1)
    ax.text(1.7, 6.0, "INDEXING PHASE (Offline)", fontsize=10, fontweight="bold", color="#1A5F7A")
    
    draw_box(1.5, 4.8, 2.0, 0.6, "Technical Manuals\n(PDF / Text Documents)", fc="#eef4f8", ec="#1A5F7A", tc="#2F4858")
    draw_box(4.0, 4.8, 2.0, 0.6, "Text Chunking\n(Segmenting Manuals)", fc="#eef4f8", ec="#1A5F7A", tc="#2F4858")
    draw_box(6.5, 4.8, 2.0, 0.6, "Gemini Embedding\n(text-embedding-004)", fc="#eef4f8", ec="#1A5F7A", tc="#2F4858")
    draw_db(8.8, 4.8, "MongoDB Vector\nDatabase")
    
    # QUERY PHASE
    rect2 = patches.FancyBboxPatch((0.2, 0.2), 9.6, 3.2, boxstyle="round,pad=0.1", fc="#fffaf5", ec="#e65100", lw=1.5)
    ax.add_patch(rect2)
    ax.text(1.7, 3.1, "QUERY PHASE (Online)", fontsize=10, fontweight="bold", color="#e65100")
    
    draw_box(1.5, 2.2, 2.0, 0.6, "User Query\n(Troubleshooting Question)", fc="#fff3e0", ec="#e65100", tc="#2F4858")
    draw_box(4.0, 2.2, 2.0, 0.6, "Gemini Embedding\n(text-embedding-004)", fc="#fff3e0", ec="#e65100", tc="#2F4858")
    draw_box(6.5, 2.2, 2.0, 0.6, "Semantic Search\n(MongoDB Vector Lookup)", fc="#fff3e0", ec="#e65100", tc="#2F4858")
    
    draw_box(4.0, 0.8, 2.0, 0.6, "Context Assembly\n(Question + Chunks)", fc="#fff3e0", ec="#e65100", tc="#2F4858")
    draw_box(6.5, 0.8, 2.0, 0.6, "Gemini LLM API\n(gemini-1.5-flash)", fc="#fff3e0", ec="#e65100", tc="#2F4858")
    draw_box(8.8, 1.5, 1.8, 0.6, "Generated Answer\n(Response to User)", fc="#e8f5e9", ec="#2e7d32", tc="#1b5e20", fw="bold")

    # Arrows
    def draw_arrow(x1, y1, x2, y2):
        ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle="->", lw=1.2, color="#546e7a"))

    draw_arrow(2.6, 4.8, 2.9, 4.8)
    draw_arrow(5.1, 4.8, 5.4, 4.8)
    draw_arrow(7.6, 4.8, 7.9, 4.8)
    
    draw_arrow(2.6, 2.2, 2.9, 2.2)
    draw_arrow(5.1, 2.2, 5.4, 2.2)
    draw_arrow(6.5, 1.9, 6.5, 1.2) # Semantic search to Context
    draw_arrow(8.8, 4.4, 6.5, 2.6) # Database feed to search
    draw_arrow(5.1, 0.8, 5.4, 0.8)
    draw_arrow(7.6, 0.8, 8.8, 1.1)
    draw_arrow(8.8, 1.9, 8.8, 2.5) # Response back
    draw_arrow(8.8, 2.5, 1.5, 2.6)

    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "with_rag_pipeline.png"), bbox_inches='tight')
    plt.close()

if __name__ == "__main__":
    draw_compatibility_flowchart()
    draw_rag_pipeline()
    print("Diagrams generated successfully!")
