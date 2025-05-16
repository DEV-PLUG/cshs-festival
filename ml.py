import cv2
import numpy as np
import base64
import tempfile
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import ffmpeg  # pip install ffmpeg-python


app = Flask(__name__)
CORS(app)

fgbg = cv2.createBackgroundSubtractorMOG2(detectShadows=True)
movement_threshold = 30
min_area = 10

def convert_to_mp4(input_path):
    output_path = input_path.replace('.webm', '.mp4')
    (
        ffmpeg
        .input(input_path)
        .output(output_path, vcodec='libx264', acodec='aac', movflags='faststart')
        .overwrite_output()
        .run()
    )
    return output_path

def convert_to_webm(input_path):
    output_path = input_path.replace('.mp4', '_converted.webm')
    (
        ffmpeg
        .input(input_path)
        .output(output_path, vcodec='libvpx-vp9', acodec='libopus')
        .overwrite_output()
        .run()
    )
    return output_path

def process_video_file(input_video_path):
    cap = cv2.VideoCapture(input_video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 20
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as output_tmp:
        output_video_path = output_tmp.name

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        fgmask = fgbg.apply(frame)
        _, binary_mask = cv2.threshold(fgmask, 200, 255, cv2.THRESH_BINARY)
        kernel = np.ones((3, 3), np.uint8)
        cleaned_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_OPEN, kernel)
        cleaned_mask = cv2.morphologyEx(cleaned_mask, cv2.MORPH_CLOSE, kernel)

        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        lower_black = np.array([0, 0, 0])
        upper_black = np.array([180, 100, 60])
        color_mask = cv2.inRange(hsv, lower_black, upper_black)
        final_mask = cv2.bitwise_and(cleaned_mask, color_mask)

        contours, _ = cv2.findContours(final_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area > min_area:
                x, y, w, h = cv2.boundingRect(cnt)
                cx, cy = x + w // 2, y + h // 2
                if area > movement_threshold:
                    cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
                    cv2.circle(frame, (cx, cy), 5, (0, 0, 255), -1)
                    cv2.putText(frame, f"({cx},{cy})", (x, y - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)

        out.write(frame)

    cap.release()
    out.release()

    return output_video_path  # mp4 경로 반환

@app.route('/process_video', methods=['POST'])
def process_video_endpoint():
    try:
        if 'video' not in request.files:
            return jsonify({'error': 'No video file provided'}), 400

        video_file = request.files['video']
        
        # WebM으로 임시 저장
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as temp_webm_file:
            video_file.save(temp_webm_file)
            webm_input_path = temp_webm_file.name
        print(webm_input_path)

        # WebM → MP4 변환
        mp4_input_path = convert_to_mp4(webm_input_path)

        # 영상 처리
        processed_mp4_path = process_video_file(mp4_input_path)

        # 결과 영상 다시 WebM으로 변환
        result_webm_path = convert_to_webm(processed_mp4_path)

        # 인코딩
        with open(result_webm_path, "rb") as f:
            video_binary = f.read()
            video_base64 = base64.b64encode(video_binary).decode('utf-8')
        print(video_base64)
        return jsonify({'processed_video': video_base64}), 200

    except Exception as e:
        print(str(e))
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)

