from sentence_transformers import SentenceTransformer

print("Loading model...")

model = SentenceTransformer('all-MiniLM-L6-v2')

print("Model loaded")

text = "iphone battery"
embedding = model.encode(text)

print("Embedding length:", len(embedding))
print("First 5 values:", embedding[:5])