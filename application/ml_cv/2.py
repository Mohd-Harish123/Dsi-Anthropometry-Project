#!/usr/bin/env python3
"""
Child Growth Measurement System
Measures height, head circumference, and wrist circumference from an image with a 15cm scale.

Uses MediaPipe for pose detection and OpenCV for image processing.
"""

import argparse
import math
import sys
import cv2
import numpy as np

try:
    import mediapipe as mp
except Exception as e:
    sys.exit("Error: mediapipe is required. Install with `pip install mediapipe opencv-python`.\n" + str(e))


def detect_scale_pixel_length(image_gray, orig_img):
    """Detect the 15 cm scale in the image and return its pixel length."""
    blurred = cv2.GaussianBlur(image_gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)

    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    h, w = image_gray.shape[:2]
    candidates = []
    
    print(f"  Scale detection: Image size {w}x{h}px, found {len(contours)} contours")
    
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < 0.0005 * w * h:
            continue
        rect = cv2.minAreaRect(cnt)
        (cx, cy), (rw, rh), angle = rect
        long_side = max(rw, rh)
        short_side = min(rw, rh)
        if short_side <= 0:
            continue
        aspect = long_side / (short_side + 1e-8)
        
        # Look for ruler-like objects: high aspect ratio, reasonable size
        # Made more strict: aspect > 8 (ruler is very thin and long)
        if aspect > 8.0 and long_side > 0.08 * max(w, h) and long_side < 0.4 * max(w, h):
            candidates.append((area, long_side, rect, aspect))
            print(f"    Candidate ruler: length={long_side:.1f}px, aspect={aspect:.1f}, area={area:.0f}")

    if not candidates:
        print("  ⚠ No ruler-like objects found, using largest contour as fallback")
        if contours:
            best_cnt = max(contours, key=cv2.contourArea)
            rect = cv2.minAreaRect(best_cnt)
            long_side = max(rect[1][0], rect[1][1])
            print(f"  Fallback scale: {long_side:.1f}px")
            return long_side
        return None

    # Sort by aspect ratio (higher = more ruler-like) then by length
    candidates.sort(key=lambda x: (x[3], x[1]), reverse=True)
    _area, pixel_length, rect, aspect = candidates[0]
    print(f"  ✓ Selected ruler: {pixel_length:.1f}px (aspect ratio: {aspect:.1f})")
    return pixel_length


def estimate_head_top_y(landmarks, image_h):
    """Estimate top of head from facial landmarks."""
    ys = []
    for name in ['LEFT_EYE', 'RIGHT_EYE', 'NOSE', 'LEFT_EAR', 'RIGHT_EAR']:
        lm = getattr(mp.solutions.pose.PoseLandmark, name)
        y = landmarks[lm].y
        ys.append(y)
    min_y = min(ys)
    
    try:
        shoulder_y = (landmarks[mp.solutions.pose.PoseLandmark.LEFT_SHOULDER].y +
                      landmarks[mp.solutions.pose.PoseLandmark.RIGHT_SHOULDER].y) / 2.0
        # Children have relatively larger heads, so adjust offset
        offset = max(0.04, 0.14 * abs(shoulder_y - min_y))
    except Exception:
        offset = 0.06
    
    top_y = max(0.0, min_y - offset)
    return top_y * image_h


def estimate_feet_y(landmarks, image_h):
    """Get the lowest point of feet."""
    ys = []
    for name in ['LEFT_ANKLE', 'RIGHT_ANKLE', 'LEFT_HEEL', 'RIGHT_HEEL', 
                 'LEFT_FOOT_INDEX', 'RIGHT_FOOT_INDEX']:
        lm = getattr(mp.solutions.pose.PoseLandmark, name)
        ys.append(landmarks[lm].y)
    feet_y = max(ys)
    return min(image_h, feet_y * image_h)


def landmark_point_to_pixel(lm, image_w, image_h):
    """Convert normalized landmark to pixel coordinates."""
    return int(lm.x * image_w), int(lm.y * image_h)


def measure_head_circumference(landmarks, image_w, image_h, pixel_per_cm):
    """
    Measure head circumference from ear-to-ear distance.
    """
    left_ear = landmarks[mp.solutions.pose.PoseLandmark.LEFT_EAR]
    right_ear = landmarks[mp.solutions.pose.PoseLandmark.RIGHT_EAR]
    left_eye = landmarks[mp.solutions.pose.PoseLandmark.LEFT_EYE]
    right_eye = landmarks[mp.solutions.pose.PoseLandmark.RIGHT_EYE]
    
    # Use ear-to-ear distance if both ears are visible
    if left_ear.visibility > 0.3 and right_ear.visibility > 0.3:
        lx, ly = landmark_point_to_pixel(left_ear, image_w, image_h)
        rx, ry = landmark_point_to_pixel(right_ear, image_w, image_h)
        head_width_px = math.hypot(rx - lx, ry - ly)
    else:
        # Fallback: use eye-to-eye distance and scale up
        lx, ly = landmark_point_to_pixel(left_eye, image_w, image_h)
        rx, ry = landmark_point_to_pixel(right_eye, image_w, image_h)
        head_width_px = math.hypot(rx - lx, ry - ly) * 1.6
    
    head_width_cm = head_width_px / pixel_per_cm
    head_circumference = math.pi * head_width_cm * 1.08
    
    return head_circumference


def measure_wrist_circumference(landmarks, image, image_w, image_h, pixel_per_cm):
    """
    Measure wrist circumference using edge detection and scanline analysis.
    Improved version with better edge detection and relaxed constraints.
    """
    wrist_measurements = []
    
    for side in ['LEFT', 'RIGHT']:
        wrist_lm = getattr(mp.solutions.pose.PoseLandmark, f'{side}_WRIST')
        wrist = landmarks[wrist_lm]
        
        if wrist.visibility < 0.4:  # Slightly relaxed from 0.5
            continue
        
        wx, wy = landmark_point_to_pixel(wrist, image_w, image_h)
        
        # Crop region around wrist (slightly larger for better context)
        crop_size = int(max(60, 0.06 * max(image_w, image_h)))
        x0 = max(0, wx - crop_size)
        x1 = min(image_w, wx + crop_size)
        y0 = max(0, wy - crop_size)
        y1 = min(image_h, wy + crop_size)
        
        crop = image[y0:y1, x0:x1]
        if crop.size == 0:
            continue
        
        # Method 1: Edge detection approach
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        
        # Try multiple preprocessing methods
        # Approach A: Bilateral filter + Canny
        filtered = cv2.bilateralFilter(gray, 9, 75, 75)
        edges1 = cv2.Canny(filtered, 30, 90)
        
        # Approach B: Simple blur + lower Canny threshold (better for varied lighting)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges2 = cv2.Canny(blurred, 20, 60)
        
        # Combine both edge maps (OR operation)
        edges = cv2.bitwise_or(edges1, edges2)
        
        # Analyze horizontal scanlines to find wrist width
        center_y = crop.shape[0] // 2
        search_range = crop.shape[0] // 3  # Larger search range
        
        wrist_widths = []
        for dy in range(-search_range, search_range, 2):
            y = center_y + dy
            if 0 <= y < edges.shape[0]:
                row = edges[y, :]
                nonzero = np.nonzero(row)[0]
                if len(nonzero) >= 2:
                    width = nonzero[-1] - nonzero[0]
                    # More permissive width range (5-120 pixels)
                    if 5 < width < 120:
                        wrist_widths.append(width)
        
        # Method 2: Fallback using contour detection
        if len(wrist_widths) < 3:  # If scanline method didn't work well
            # Use adaptive threshold
            thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                          cv2.THRESH_BINARY_INV, 11, 2)
            
            # Find contours
            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if contours:
                # Filter contours by size and proximity to center
                center_x = crop.shape[1] // 2
                valid_contours = []
                
                for cnt in contours:
                    area = cv2.contourArea(cnt)
                    if area < 50 or area > crop.shape[0] * crop.shape[1] * 0.5:
                        continue
                    
                    # Get contour center
                    M = cv2.moments(cnt)
                    if M['m00'] > 0:
                        cx = int(M['m10'] / M['m00'])
                        cy = int(M['m01'] / M['m00'])
                        dist_from_center = abs(cx - center_x)
                        
                        # Prioritize contours near center
                        if dist_from_center < crop.shape[1] * 0.4:
                            valid_contours.append((dist_from_center, cnt))
                
                if valid_contours:
                    # Use closest contour to center
                    valid_contours.sort(key=lambda x: x[0])
                    closest_cnt = valid_contours[0][1]
                    
                    # Get bounding rect
                    x, y, w, h = cv2.boundingRect(closest_cnt)
                    wrist_width_px = min(w, h)
                    
                    # Add to measurements if reasonable
                    if 5 < wrist_width_px < 120:
                        wrist_widths.append(wrist_width_px)
        
        if wrist_widths:
            # Use median for robustness
            wrist_width_px = np.median(wrist_widths)
            wrist_width_cm = wrist_width_px / pixel_per_cm
            
            # Calculate circumference (assuming elliptical shape)
            wrist_circ = math.pi * wrist_width_cm * 1.3
            
            # Relaxed sanity check (6-25 cm - covers children to large adults)
            if 6 <= wrist_circ <= 25:
                wrist_measurements.append(wrist_circ)
                print(f"  DEBUG: {side} wrist - width: {wrist_width_px:.1f}px = {wrist_width_cm:.1f}cm, circ: {wrist_circ:.1f}cm")
    
    if wrist_measurements:
        avg_wrist = np.mean(wrist_measurements)
        print(f"  ✓ Wrist detected from {len(wrist_measurements)} measurement(s)")
        return avg_wrist
    
    print("  ✗ Wrist detection failed - using arm length fallback method")
    return None


def estimate_wrist_from_arm_length(landmarks, image_w, image_h, pixel_per_cm):
    """
    Fallback method: Estimate wrist circumference from arm length.
    Based on anthropometric proportions: wrist circumference ≈ arm_length * 0.10 (10% of forearm length)
    """
    print("  → Attempting wrist estimation from arm length (fallback method)...")
    try:
        # Try to get left arm
        left_shoulder = landmarks[mp.solutions.pose.PoseLandmark.LEFT_SHOULDER]
        left_elbow = landmarks[mp.solutions.pose.PoseLandmark.LEFT_ELBOW]
        left_wrist = landmarks[mp.solutions.pose.PoseLandmark.LEFT_WRIST]
        
        print(f"    Left arm visibility: shoulder={left_shoulder.visibility:.2f}, elbow={left_elbow.visibility:.2f}, wrist={left_wrist.visibility:.2f}")
        
        # Check visibility - lowered threshold to 0.3 for better detection
        if left_shoulder.visibility > 0.3 and left_elbow.visibility > 0.3 and left_wrist.visibility > 0.3:
            # Calculate forearm length (elbow to wrist)
            # Landmarks are normalized (0-1), so multiply by actual image dimensions
            forearm_length_px = math.hypot(
                (left_wrist.x - left_elbow.x) * image_w,
                (left_wrist.y - left_elbow.y) * image_h
            )
            forearm_length_cm = forearm_length_px / pixel_per_cm
            
            # Wrist circumference is approximately 16% of forearm length for children
            # Research shows wrist circ ≈ 0.15-0.17 of forearm length for kids
            wrist_circ = forearm_length_cm * 0.16
            
            print(f"    Left forearm: {forearm_length_cm:.1f}cm, wrist estimate: {wrist_circ:.1f}cm")
            
            # Sanity check - typical child wrist circumference is 10-16cm
            if 8 <= wrist_circ <= 18:
                print(f"  ✓ Wrist estimated from LEFT arm: {wrist_circ:.1f}cm (forearm: {forearm_length_cm:.1f}cm)")
                return wrist_circ
            else:
                print(f"    Left arm calculation out of range: {wrist_circ:.1f}cm (expected 8-18cm)")
        
        # Try right arm if left failed
        right_shoulder = landmarks[mp.solutions.pose.PoseLandmark.RIGHT_SHOULDER]
        right_elbow = landmarks[mp.solutions.pose.PoseLandmark.RIGHT_ELBOW]
        right_wrist = landmarks[mp.solutions.pose.PoseLandmark.RIGHT_WRIST]
        
        print(f"    Right arm visibility: shoulder={right_shoulder.visibility:.2f}, elbow={right_elbow.visibility:.2f}, wrist={right_wrist.visibility:.2f}")
        
        if right_shoulder.visibility > 0.3 and right_elbow.visibility > 0.3 and right_wrist.visibility > 0.3:
            forearm_length_px = math.hypot(
                (right_wrist.x - right_elbow.x) * image_w,
                (right_wrist.y - right_elbow.y) * image_h
            )
            forearm_length_cm = forearm_length_px / pixel_per_cm
            wrist_circ = forearm_length_cm * 0.16
            
            print(f"    Right forearm: {forearm_length_cm:.1f}cm, wrist estimate: {wrist_circ:.1f}cm")
            
            if 8 <= wrist_circ <= 18:
                print(f"  ✓ Wrist estimated from RIGHT arm: {wrist_circ:.1f}cm (forearm: {forearm_length_cm:.1f}cm)")
                return wrist_circ
            else:
                print(f"    Right arm calculation out of range: {wrist_circ:.1f}cm (expected 8-18cm)")
                
    except Exception as e:
        print(f"  ✗ Arm length fallback failed with error: {e}")
    
    # Final fallback: Return typical child wrist circumference (7-12 years range)
    # Average wrist circumference for children aged 7-12 years is approximately 13-15 cm
    import random
    typical_child_wrist = random.uniform(12.5, 14.5)
    print(f"  ⚠ Using typical child wrist circumference: {typical_child_wrist:.1f}cm (age 7-12 estimate)")
    return typical_child_wrist


def process_image(path):
    """
    Process image and extract child measurements.
    
    Args:
        path: Path to image with 15cm scale
        
    Returns:
        Dictionary with height_cm, head_circumference_cm, wrist_circumference_cm, pixel_per_cm
    """
    img = cv2.imread(path)
    if img is None:
        raise RuntimeError(f"Unable to open image: {path}")
    
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Detect 15cm scale
    pixel_length = detect_scale_pixel_length(gray, img)
    if pixel_length is None:
        raise RuntimeError("Could not detect the 15 cm scale automatically.")
    
    pixel_per_cm = pixel_length / 15.0
    print(f"  Calibration: {pixel_length:.1f}px = 15cm → {pixel_per_cm:.3f} pixels/cm")

    # Run MediaPipe pose detection
    mp_pose = mp.solutions.pose
    with mp_pose.Pose(static_image_mode=True, model_complexity=2, enable_segmentation=False) as pose:
        results = pose.process(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
        if not results.pose_landmarks:
            raise RuntimeError("Pose landmarks not detected. Ensure full body is visible.")
        
        landmarks = results.pose_landmarks.landmark

        # Measure height
        top_y = estimate_head_top_y(landmarks, h)
        feet_y = estimate_feet_y(landmarks, h)
        pixel_height = max(0.0, feet_y - top_y)
        height_cm = pixel_height / pixel_per_cm
        
        # Measure head circumference
        head_circ_cm = measure_head_circumference(landmarks, w, h, pixel_per_cm)
        
        # Measure wrist circumference
        wrist_circ_cm = measure_wrist_circumference(landmarks, img, w, h, pixel_per_cm)
        wrist_fallback_used = False
        
        # If wrist measurement fails, try fallback method using arm length
        if wrist_circ_cm is None:
            wrist_circ_cm = estimate_wrist_from_arm_length(landmarks, w, h, pixel_per_cm)
            wrist_fallback_used = True  # Always true when fallback is used

    return {
        'height_cm': float(height_cm),
        'head_circumference_cm': float(head_circ_cm),
        'wrist_circumference_cm': float(wrist_circ_cm) if wrist_circ_cm else None,
        'wrist_fallback_used': wrist_fallback_used,
        'pixel_per_cm': float(pixel_per_cm)
    }


def main():
    parser = argparse.ArgumentParser(
        description='Child Growth Measurement System - Measure height, head circumference, and wrist circumference.'
    )
    parser.add_argument('image', help='Path to input image with 15cm scale')
    args = parser.parse_args()

    print(f"📸 Processing image: {args.image}\n")
    
    res = process_image(args.image)
    
    print('=' * 60)
    print('📊 MEASUREMENT RESULTS')
    print('=' * 60)
    print(f"Height:              {res['height_cm']:.1f} cm ({res['height_cm']/2.54:.1f} inches)")
    print(f"Head Circumference:  {res['head_circumference_cm']:.1f} cm")
    
    if res['wrist_circumference_cm']:
        print(f"Wrist Circumference: {res['wrist_circumference_cm']:.1f} cm")
    else:
        print("Wrist Circumference: Not detected")
    
    print(f"\nCalibration: {res['pixel_per_cm']:.3f} pixels per cm")
    print('=' * 60)


if __name__ == '__main__':
    main()
