# Python ML Backend API Documentation

Flask-based REST API for anthropometric measurements using computer vision.

## Base URL

```
http://localhost:5000
```

For mobile devices on same network, replace `localhost` with your computer's IP address.

## Endpoints

### 1. Health Check

**GET** `/health`

Check if the API server is running.

**Response:**
```json
{
  "status": "ok",
  "message": "Anthropometry API is running"
}
```

**Example:**
```bash
curl http://localhost:5000/health
```

---

### 2. Predict Measurements (Base64)

**POST** `/predict`

Process an image and return anthropometric measurements.

**Request Body:**
```json
{
  "image": "base64_encoded_image_string"
}
```

The image can be:
- Raw base64 string
- Data URL format: `data:image/jpeg;base64,/9j/4AAQSkZJRg...`

**Response (Success):**
```json
{
  "success": true,
  "measurements": {
    "height_cm": 120.5,
    "head_circumference_cm": 52.3,
    "wrist_circumference_cm": 12.1,
    "pixel_per_cm": 15.234
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

**Example with curl:**
```bash
# Convert image to base64
BASE64_IMAGE=$(base64 -i test.jpg)

# Send request
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"$BASE64_IMAGE\"}"
```

---

### 3. Predict from URL

**POST** `/predict-url`

Process an image from a URL.

**Request Body:**
```json
{
  "url": "http://example.com/image.jpg"
}
```

**Response:**
Same as `/predict` endpoint.

**Example:**
```bash
curl -X POST http://localhost:5000/predict-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/test-image.jpg"}'
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request (invalid image data, detection failed) |
| 500 | Internal Server Error |

## Common Error Messages

### "No image data provided"
- Missing `image` field in request body
- Empty or null image data

### "Failed to decode image"
- Invalid base64 encoding
- Corrupted image data
- Unsupported image format

### "Could not detect the 15 cm scale automatically"
- No scale/ruler found in image
- Scale is too small or unclear
- Try with a clearer, more prominent scale

### "Pose landmarks not detected"
- Full body not visible in image
- Person not standing upright
- Poor image quality or lighting
- Subject too far or too close

### "Wrist measurement failed" (wrist_circumference_cm = null)
- Wrists not clearly visible
- Image quality too low
- Try different hand/arm position

## Image Requirements

For successful measurements, images must include:

1. **Full body visible** - Head to feet must be in frame
2. **15cm scale** - Clear, visible ruler or scale for calibration
3. **Standing position** - Subject standing upright
4. **Good lighting** - Adequate, even lighting
5. **Clear focus** - Sharp, not blurry image
6. **Appropriate distance** - Subject fills ~60-80% of frame height

## Testing

### Using Python

```python
import requests
import base64

# Read and encode image
with open('test.jpg', 'rb') as f:
    image_base64 = base64.b64encode(f.read()).decode('utf-8')

# Send request
response = requests.post(
    'http://localhost:5000/predict',
    json={'image': image_base64}
)

print(response.json())
```

### Using JavaScript/TypeScript

```typescript
// Read image as base64
const response = await fetch(imageUri);
const blob = await response.blob();
const base64 = await new Promise((resolve) => {
  const reader = new FileReader();
  reader.onloadend = () => resolve(reader.result);
  reader.readAsDataURL(blob);
});

// Send to API
const result = await fetch('http://localhost:5000/predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ image: base64 }),
});

const data = await result.json();
console.log(data);
```

## Running the Server

```bash
cd ml_cv
source venv/bin/activate  # Activate virtual environment
python api_server.py
```

Server will start on `http://0.0.0.0:5000`

## Development Mode

The server runs with Flask's debug mode enabled, which provides:
- Auto-reload on code changes
- Detailed error messages
- Interactive debugger

For production, disable debug mode and use a production WSGI server like Gunicorn.

## CORS Configuration

CORS is enabled for all origins to allow React Native app connections. For production, configure specific allowed origins in `api_server.py`:

```python
CORS(app, origins=['https://your-app-domain.com'])
```

## Performance Notes

- Average processing time: 2-5 seconds per image
- Maximum recommended image size: 4000x3000 pixels
- Supported formats: JPEG, PNG, BMP, TIFF
- Concurrent requests: Limited by Flask's single-threaded nature
  - For production, use multiple workers with Gunicorn

## Standalone Usage

For command-line usage without the API:

```bash
python 2.py path/to/image.jpg
```

Or:

```bash
python child.py path/to/image.jpg
```

This processes the image and prints measurements to console.
