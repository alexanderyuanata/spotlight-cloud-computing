from flask import Flask, request, jsonify

import tensorflow as tf
import pickle
from tensorflow.keras.preprocessing.sequence import pad_sequences

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

import pandas as pd
import numpy as np

import os

# loading dataset
file_path = 'film_dataset.csv'
df = pd.read_csv(file_path)

df.head()

#creating features
df['combined_features'] = df['genre'] + ' ' + df['director'] + ' ' + df['star']

tfidf = TfidfVectorizer(stop_words='english')
tfidf_matrix = tfidf.fit_transform(df['combined_features'])

#defining similiarity models
def get_similarity_score(user_input, tfidf_matrix):
    user_input_transformed = tfidf.transform(user_input['combined_features'])
    cosine_sim = cosine_similarity(user_input_transformed, tfidf_matrix)
    return cosine_sim[0]

#getting recommendations
def get_recommendations(user_input, tfidf_matrix, df):
    filtered_data = df[
        (df['genre'].str.contains(user_input['genre'][0], case=False)) &
        (df['year'] >= user_input['year'][0]) &
        (df['runtime'] <= user_input['runtime'][0]) &
        (df['rating'] >= user_input['rating'][0]) &
        (df['votes'] >= user_input['votes'][0])
    ].reset_index(drop=True)

    if len(filtered_data) >= 8:
        similarity_scores = get_similarity_score(user_input, tfidf_matrix[filtered_data.index])
        filtered_data['similarity_score'] = similarity_scores
        filtered_data = filtered_data.sort_values(by='similarity_score', ascending=False)
        recommendations = filtered_data.head(8).to_dict(orient='records')
    else:
        additional_data = df[df['genre'].str.contains(user_input['genre'][0], case=False)]
        additional_data = additional_data[~additional_data.index.isin(filtered_data.index)].reset_index(drop=True)
        additional_similarity_scores = get_similarity_score(user_input, tfidf_matrix[additional_data.index])
        additional_data['similarity_score'] = additional_similarity_scores
        additional_data = additional_data.sort_values(by='similarity_score', ascending=False)
        remaining_count = 8 - len(filtered_data)
        if remaining_count > 0:
            additional_recommendations = additional_data.head(remaining_count).to_dict(orient='records')
            recommendations = filtered_data.to_dict(orient='records') + additional_recommendations
        else:
            recommendations = filtered_data.to_dict(orient='records')

    return recommendations


# Loading aplikasi flask
app = Flask(__name__)

# API routes
# health checks
@app.route('/check', methods=['GET'])
def check():
    return jsonify({'message':'movie api is up and running'}), 200

# run prediction
@app.route('/recommend', methods=['POST'])
def predict():
    # make sure the caller has a key
    api_key = request.args.get('key')
    valid_key = os.environ.get('API_KEY')

    if api_key != valid_key and valid_key != None:
        return jsonify({'error':'no valid api key passed to invoke model!'}), 403

    data = request.get_json(force=True)

    year = data.get('year', None)
    runtime = data.get('runtime', None)
    genre = data.get('genre', None)
    rating = data.get('rating', None)
    director = data.get('director', '')
    star = data.get('star', '')
    votes = data.get('votes', None)

    if any(value is None for value in (year, runtime, genre, rating, votes)):
        return jsonify({
        'status': 'failure',
        'message': 'mandatory data not found in request body (year/runtime/genre/rating/votes)'
        }), 400

    # parse request json
    inputData = pd.DataFrame({
    'year': [year],
    'runtime': [runtime],
    'genre': [genre],
    'rating': [rating],
    'director': [director],
    'star': [star],
    'votes': [votes]
    })
    inputData['combined_features'] = inputData['genre'] + ' ' + inputData['director'] + ' ' + inputData['star']

    recommendations = get_recommendations(inputData, tfidf_matrix, df)
    print(recommendations)

    return jsonify({
        'status': 'success',
        'recommendations': recommendations
        }), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0')


