# -*- coding: utf-8 -*-
# import dependencies
from flask import Flask, request, jsonify

import tensorflow as tf

import keras

from tensorflow.keras.preprocessing.sequence import pad_sequences
from sklearn.preprocessing import LabelEncoder, StandardScaler

import numpy as np

import joblib

from pickle import load

import os

print(tf.__version__)
print(keras.__version__)

# load models and artifacts
model = tf.keras.models.load_model('stress.h5', compile=False)
scaler = joblib.load('./stress_level_scaler.pkl')

# init flask app
app = Flask(__name__)

# predict stress level
def predictStress(user_input:dict, model):
  input_array = np.array([list(user_input.values())])
  input_scaled = scaler.transform(input_array)
    
  prediction = model.predict(input_scaled)
  return prediction[0][0]

# API routes
# health checks
@app.route('/check', methods=['GET'])
def check():
    return jsonify({
        'status': 'success',
        'message': 'stress api is up and running'
        }), 200

# run prediction
@app.route('/predict', methods=['POST'])
def predict():
    # make sure the caller has a key
    api_key = request.args.get('key')
    valid_key = os.environ.get('API_KEY')

    if api_key != valid_key and valid_key != None:
        return jsonify({
            'status': 'failure',
            'error':'no valid api key passed to invoke model!'
            }), 403

    # parse request json
    data = request.get_json(force=True)

    keys = ['sleep_duration', 'sleep_quality', 'physical_activity', 'bmi', 'blood_pressure', 'heart_rate', 'daily_steps', 'sleep_disorder']
    if any(data.get(key) is None for key in keys):
        return jsonify({
            'status': 'failure',
            'message': 'missing a mandatory field in json request!'
            }), 400

    # fields are fine, predict
    prediction = predictStress(data, model)

    # process the prediction and clamp it
    result = max(1, min(round(prediction / 2), 10))

    return jsonify({'status': 'success', 'stress_level': result}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0')