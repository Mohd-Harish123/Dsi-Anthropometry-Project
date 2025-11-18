#!/usr/bin/env python3
"""
Flask API Server for Child Anthropometry Measurements
Receives images and returns height, head circumference, and wrist circumference predictions
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import io
import cv2
import numpy as np
from child import process_image
import tempfile
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for React Native requests

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'message': 'Anthropometry API is running'
    }), 200

@app.route('/predict', methods=['POST'])
def predict_measurements():
    """
    Process an image and return anthropometric measurements
    
    Expected JSON payload:
    {
        "image": "base64_encoded_image_string"
    }
    
    Returns:
    {
        "success": true,
        "measurements": {
            "height_cm": 120.5,
            "head_circumference_cm": 52.3,
            "wrist_circumference_cm": 12.1
        }
    }
    """
    try:
        # Get JSON data from request
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                'success': False,
                'error': 'No image data provided'
            }), 400
        
        # Decode base64 image
        image_base64 = data['image']
        
        # Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]
        
        # Decode base64 to bytes
        image_bytes = base64.b64decode(image_base64)
        
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return jsonify({
                'success': False,
                'error': 'Failed to decode image'
            }), 400
        
        # Save to temporary file for processing
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            temp_path = temp_file.name
            cv2.imwrite(temp_path, img)
        
        try:
            # Process the image using the child.py module
            results = process_image(temp_path)
            
            # Clean up temporary file
            os.unlink(temp_path)
            
            # Return results
            return jsonify({
                'success': True,
                'measurements': {
                    'height_cm': round(results['height_cm'], 1),
                    'head_circumference_cm': round(results['head_circumference_cm'], 1),
                    'wrist_circumference_cm': round(results['wrist_circumference_cm'], 1) if results['wrist_circumference_cm'] else None,
                    'pixel_per_cm': round(results['pixel_per_cm'], 3)
                }
            }), 200
            
        except RuntimeError as e:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.unlink(temp_path)
            
            return jsonify({
                'success': False,
                'error': str(e)
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500

@app.route('/predict-url', methods=['POST'])
def predict_from_url():
    """
    Alternative endpoint that accepts image URL
    
    Expected JSON payload:
    {
        "url": "http://example.com/image.jpg"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'url' not in data:
            return jsonify({
                'success': False,
                'error': 'No image URL provided'
            }), 400
        
        # Download image from URL
        import urllib.request
        with urllib.request.urlopen(data['url']) as response:
            image_bytes = response.read()
        
        # Convert to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return jsonify({
                'success': False,
                'error': 'Failed to decode image from URL'
            }), 400
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            temp_path = temp_file.name
            cv2.imwrite(temp_path, img)
        
        try:
            # Process the image
            results = process_image(temp_path)
            
            # Clean up
            os.unlink(temp_path)
            
            return jsonify({
                'success': True,
                'measurements': {
                    'height_cm': round(results['height_cm'], 1),
                    'head_circumference_cm': round(results['head_circumference_cm'], 1),
                    'wrist_circumference_cm': round(results['wrist_circumference_cm'], 1) if results['wrist_circumference_cm'] else None,
                    'pixel_per_cm': round(results['pixel_per_cm'], 3)
                }
            }), 200
            
        except RuntimeError as e:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
            
            return jsonify({
                'success': False,
                'error': str(e)
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print("=" * 60)
    print("🚀 Starting Anthropometry API Server")
    print("=" * 60)
    print(f"📍 Server will run on: http://0.0.0.0:{port}")
    print(f"📍 Health check: http://localhost:{port}/health")
    print(f"📍 Predict endpoint: http://localhost:{port}/predict")
    print("=" * 60)
    
    # Run Flask app
    app.run(host='0.0.0.0', port=port, debug=True)
