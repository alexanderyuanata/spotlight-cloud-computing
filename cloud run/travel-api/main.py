# -*- coding: utf-8 -*-

from flask import Flask, request, jsonify

import pickle

import tensorflow as tf

import keras

from tensorflow.keras.preprocessing.sequence import pad_sequences

import numpy as np

import pandas as pd

import os

print(tf.__version__)
print(keras.__version__)

# load models and artifacts
model = tf.keras.models.load_model('text_classification_model.h5', compile=False)
with open('tokenizer.pickle', 'rb') as handle:
    tokenizer = pickle.load(handle)
with open('label_encoder.pickle', 'rb') as handle:
    label_encoder = pickle.load(handle)

# load the travel data to use as response
data = pd.read_csv('wisata.csv')

app = Flask(__name__)

# classify input text
def classify_text(text):
    sequence = tokenizer.texts_to_sequences([text])
    padded_sequence = pad_sequences(sequence, maxlen=475, padding='post')
    prediction = model.predict(padded_sequence)
    label_index = np.argmax(prediction)
    label = label_encoder.inverse_transform([label_index])[0]
    return label

# recommendation logic
def provide_recommendation(class_label, city=None, rating_preference=None, review_preference=None):
    recommendations = data[data['Categories'] == class_label]

    if city:
        recommendations = recommendations[recommendations['City'] == city]

    if rating_preference:
        if rating_preference == "3 stars and above":
            recommendations = recommendations[recommendations['Ratings'] >= 3]
        elif rating_preference == "4 stars and above":
            recommendations = recommendations[recommendations['Ratings'] >= 4]
        elif rating_preference == "5 stars":
            recommendations = recommendations[recommendations['Ratings'] >= 5]

    if review_preference:
        if review_preference == "More than 10 reviews":
            recommendations = recommendations[recommendations['Rating_Count'] > 10]
        elif review_preference == "More than 20 reviews":
            recommendations = recommendations[recommendations['Rating_Count'] > 20]

    return recommendations.to_dict(orient='records')


# API routes
# health checks
@app.route('/check', methods=['GET'])
def check():
    return jsonify({'message':'api is up and running'}), 200

# run prediction
@app.route('/recommend', methods=['POST'])
def predict():
    # make sure the caller has a key
    api_key = request.args.get('key')
    valid_key = os.environ.get('API_KEY')

    if api_key != valid_key and valid_key != None:
        return jsonify({'error':'no valid api key passed to invoke model!'}), 403

    # parse request json
    data = request.get_json(force=True)
    text = data.get('text', '')
    city = data.get('city', None)
    rating_preference = data.get('rating_preference', None)
    review_preference = data.get('review_preference', None)

    if not text:
        return jsonify({'error': 'Text field is required'}), 400

    class_label = classify_text(text)
    recommendations = provide_recommendation(class_label, city, rating_preference, review_preference)

    return jsonify({'class_label': class_label, 'recommendations': recommendations}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0')