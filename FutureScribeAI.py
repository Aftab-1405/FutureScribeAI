# Importing necessary modules and packages
import os  # Operating system functionalities
import random  # Random number generation
import logging  # Logging system
import networkx as nx  # Graph-based algorithms
from flask import Flask, request, jsonify, render_template  # Flask web framework
from flask_cors import CORS  # Cross-Origin Resource Sharing support
from concurrent.futures import ThreadPoolExecutor  # Asynchronous execution
import google.generativeai as genai  # Google's Generative AI module
import nltk  # Natural Language Toolkit
from nltk.tokenize import sent_tokenize  # Sentence tokenization
from nltk.corpus import stopwords  # Stopwords
from sklearn.feature_extraction.text import TfidfVectorizer  # TF-IDF vectorizer
from sklearn.metrics.pairwise import cosine_similarity  # Cosine similarity calculation

# Downloading NLTK data for tokenization
nltk.download('punkt')
# Downloading NLTK data for stopwords
nltk.download('stopwords')

# Creating a Flask application instance
app = Flask(__name__)
# Enabling CORS support for the Flask application
CORS(app)
# Configuring logging system to output INFO level messages
logging.basicConfig(level=logging.INFO)

# Google API key for accessing generative AI models
GOOGLE_API_KEY = 'AIzaSyDPW5RU41CE_FklnEvLsL3TZw7kMGNK9nM'
# Configuring the generative AI module with the API key
genai.configure(api_key=GOOGLE_API_KEY)

# Variations that can be added to the summary
VARIATIONS = ["It seems to me that:", "From what I can gather:", 
              "After going through the details, it appears that:", 
              "Considering all aspects, I'd say:", "In my opinion, based on the information provided:"]

# Function to compute similarity matrix between sentences
def compute_sentence_similarity(sentences):
    # Initializing TF-IDF vectorizer with English stopwords
    vectorizer = TfidfVectorizer(stop_words=stopwords.words('english'))
    # Transforming sentences into TF-IDF vectors
    sentence_vectors = vectorizer.fit_transform(sentences)
    # Computing cosine similarity matrix
    similarity_matrix = cosine_similarity(sentence_vectors)
    return similarity_matrix

# Function to generate summary using LexRank algorithm
def lexrank_summarize(text, num_sentences=3):
    # Tokenizing text into sentences
    sentences = sent_tokenize(text)
    # Computing similarity matrix between sentences
    similarity_matrix = compute_sentence_similarity(sentences)
    
    # Converting similarity matrix into a graph
    nx_graph = nx.from_numpy_array(similarity_matrix)
    # Calculating PageRank scores of sentences
    scores = nx.pagerank(nx_graph)
    # Sorting sentences based on their scores
    ranked_sentences = sorted(((scores[i], s) for i, s in enumerate(sentences)), reverse=True)
    # Generating summary from top-ranked sentences
    summary = ' '.join([ranked_sentences[i][1] for i in range(min(num_sentences, len(sentences)))])
    return summary

# Function to generate extractive summary
def extractive_summarize(text, num_sentences=3):
    return lexrank_summarize(text, num_sentences)

# Function to generate abstractive summary using generative model
def abstractive_summarize(text):
    # Prompting the generative model to summarize the text
    prompt = "Summarize this text in highlighted bullet points and numbers: " + text
    # Initializing generative model
    model = genai.GenerativeModel('gemini-pro')
    # Generating summary
    response = model.generate_content(prompt)
    return response.text

# Function to asynchronously generate summary using a specified model
def async_summarize_with_model(text, model_id):
    with ThreadPoolExecutor() as executor:
        future = executor.submit(summarize_with_model, text, model_id)
        return future.result()

# Function to generate summary using a specified model
def summarize_with_model(text, model_id):
    try:
        if model_id == 'extractive':
            return extractive_summarize(text)
        elif model_id == 'abstractive':
            return abstractive_summarize(text)
    except Exception as e:
        # Logging error if summarization fails
        logging.error(f"Request failed: {e}")
        return "Error: Summarization request failed."

# Function to add a random variation to the summary
def add_variation(summary):
    variation = random.choice(VARIATIONS)
    return f"{variation} {summary}"

# Route for handling GET requests to the root URL
@app.route('/', methods=['GET'])
def index():
    return render_template('FutureScribeAI.html')

# Route for handling POST requests to the "/api/v1/summarize" URL
@app.route('/api/v1/summarize', methods=['POST'])
def summarize():
    # Getting data from the request
    data = request.get_json()
    text = data.get('text')  # Extracting text to be summarized
    task = data.get('task', 'abstractive')  # Extracting summarization task type
    if not text:
        # Returning error response if text is missing
        return jsonify({'error': 'Text is required'}), 400
    
    # Determining the model to be used based on task type
    model_id = 'abstractive' if task == 'abstractive' else 'extractive'
    # Generating summary asynchronously using the specified model
    summary = async_summarize_with_model(text, model_id)
    # Adding variation to the summary and returning the response
    return jsonify({'summary': add_variation(summary)}) if summary else jsonify({'error': 'Summarization failed'})

# Running the Flask application
if __name__ == '__main__':
    # Dynamic port allocation for flexibility across different environments
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
