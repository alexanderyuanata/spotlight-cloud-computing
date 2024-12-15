from flask import Flask, request, jsonify

import tensorflow as tf
import pickle
from tensorflow.keras.preprocessing.sequence import pad_sequences

import pandas as pd
import numpy as np

import os

# Memuat model
model = tf.keras.models.load_model('text_classification_model.h5')

# Memuat tokenizer
with open('./tokenizer.pickle', 'rb') as handle:
    tokenizer = pickle.load(handle)

# Memuat label encoder
with open('./label_encoder.pickle', 'rb') as handle:
    label_encoder = pickle.load(handle)

data = pd.read_csv('./book.csv')

# Loading aplikasi flask
app = Flask(__name__)

# Membuat model untuk klasifikasi
def classify_text(text):
    # Tokenisasi dan padding teks input
    sequences = tokenizer.texts_to_sequences([text])
    padded_sequences = pad_sequences(sequences, maxlen=500)  # Adjust maxlen according to your model setup
    prediction = model.predict(padded_sequences)
    class_label = np.argmax(prediction, axis=1)[0]

    return class_label

# Memberi rekomendasi
def provide_book_recommendation(genre_label, author=None, rating_preference=None):
    # debugging
    print(genre_label)
    print(author)
    print(rating_preference)
    
    # get genre label
    recommendations = data[data['Genre_Label'] == genre_label]

    if author:
        recommendations = recommendations[recommendations['Author'].str.contains(author, case=False)]

    if rating_preference:
        if rating_preference == 3:
            recommendations = recommendations[recommendations['Avg_Rating'] >= 3]
        elif rating_preference == 4:
            recommendations = recommendations[recommendations['Avg_Rating'] >= 4]
        elif rating_preference == 5:
            recommendations = recommendations[recommendations['Avg_Rating'] == 5]

    # process the dataframe
    recommendations = recommendations[['Book', 'Author', 'Description', 'Genres', 'Avg_Rating']].head(8)

    recommendations_dict = recommendations.to_dict(orient='records')

    return recommendations_dict

# aplikasi API flask

# API routes
# health checks
@app.route('/check', methods=['GET'])
def check():
    return jsonify({'message':'book api is up and running'}), 200

# run prediction
@app.route('/recommend', methods=['POST'])
def predict():
    # make sure the caller has a key
    api_key = request.args.get('key')
    valid_key = os.environ.get('API_KEY')

    if api_key != valid_key and valid_key != None:
        return jsonify({'error':'no valid api key passed to invoke model!'}), 403

    # parse request json
    inputData = request.get_json(force=True)
    text = inputData.get('text', '')
    author = inputData.get('author', None)
    rating = inputData.get('rating_preference', None)

    if not text:
        return jsonify({'error': 'Text field is required'}), 400

    class_label = classify_text(text)

    recommendations = provide_book_recommendation(class_label, author, rating)

    return jsonify({
        'status': 'success',
        'book_count': len(recommendations),
        'recommendations': recommendations
        }), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0')


