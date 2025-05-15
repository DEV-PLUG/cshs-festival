'use client';
import { useCallback, useEffect, useRef, useState } from "react";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const videoChunks = useRef<Blob[]>([]);

  const [recordState, setRecordState] = useState(false); // true: 녹화 중
  const [state, setState] = useState(0); // 0: 초기화면, 1: 분석중, 2: 결과
  const [message, setMessage] = useState('');

  const getMediaPermission = useCallback(async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });

      if (videoRef.current) {
        videoRef.current.srcObject = videoStream;
      }

      const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ]);

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm; codecs=vp8,opus',
      });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          videoChunks.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const videoBlob = new Blob(videoChunks.current, { type: 'video/webm; codecs=vp8,opus' });
        uploadVideo(videoBlob);
      };

      mediaRecorder.current = recorder;
    } catch (err) {
      console.error('Media access error:', err);
    }
  }, []);

  const [videoData, setVideoData] = useState();
  const uploadVideo = async (blob: Blob) => {
    setState(1); // 분석중으로 변경
    const formData = new FormData();
    formData.append('video', blob, 'recorded.webm');

    try {
      const res = await fetch('http://localhost:5000/process_video', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setMessage(data.message || '');
      setVideoData(data.processed_video);

      const res2 = await fetch('/api/test', {
        method: 'POST',
        body: formData
      })
      .then((res) => res.json())
      .then((res) => {
        setMessage(res.message);
        setState(2); // 결과 보기로 이동
      })
    } catch (err) {
      console.error(err);
      setMessage('영상 처리 중 오류가 발생했습니다.');
      setState(2);
    }
  };

  const handleRecordClick = () => {
    if (recordState) {
      mediaRecorder.current?.stop(); // 녹화 종료 및 업로드
      setRecordState(false);
    } else {
      videoChunks.current = []; // 이전 chunk 초기화
      mediaRecorder.current?.start(); // 녹화 시작
      setRecordState(true);
    }
  };

  const handleRetry = () => {
    setState(0);
    getMediaPermission(); // 다시 미디어 권한 설정
  };

  useEffect(() => {
    getMediaPermission();
  }, []);

  return (
    <div>
      {state === 0 && (
        <div className="fixed top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-[800px]">
          <div className="flex justify-between items-end mb-5">
            <div>
              <div className="text-lg">제 9회 과학창의체험전 - 키이스트(정보)</div>
              <div className="text-2xl font-bold">AI로 배우는 볼링</div>
            </div>
            {recordState && (
              <div className="flex items-center space-x-1 animate-pulse">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="text-red-500">녹화중</div>
              </div>
            )}
          </div>
          <video
            className="h-[494px] w-[800px] object-cover object-center rounded-3xl"
            ref={videoRef}
            autoPlay
          />
          <div className="flex items-center justify-center mt-5 space-x-5">
            <div
              onClick={handleRecordClick}
              className={
                recordState
                  ? "px-16 py-4 rounded-2xl bg-gray-100 text-gray-500 text-center cursor-pointer hover:bg-gray-200 transition-colors"
                  : "px-16 py-4 rounded-2xl bg-red-100 text-red-500 text-center cursor-pointer hover:bg-red-200 transition-colors"
              }
            >
              {recordState ? '녹화 중지' : '녹화 시작'}
            </div>
            <div className="mr-3"></div>
            <div
              onClick={() => {}}
              className={
                recordState
                  ? "px-16 py-4 rounded-2xl bg-blue-100 text-blue-500 text-center opacity-50 transition-colors"
                  : "px-16 py-4 rounded-2xl bg-blue-100 text-blue-500 text-center cursor-not-allowed transition-colors"
              }
            >
              결과 확인
            </div>
          </div>
        </div>
      )}

      {state === 1 && (
        <div className="fixed top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 items-center justify-center">
          <div className="tossface text-[10rem] animate-bounce text-center">🤖</div>
          <div className="text-3xl font-bold text-center">AI가 영상을 살펴보고 있어요</div>
          <div className="text-lg text-center mt-1">잠시 기다리면 볼링을 더 잘 칠 수 있는 방법을 알려드릴게요</div>
        </div>
      )}

      {state === 2 && (
        <div className="fixed top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 space-y-5">
          <video className="h-[247px] w-[400px] object-cover object-center rounded-3xl" autoPlay loop controls src={'data:video/mp4;base64,' + videoData}></video>
          <div className="items-center justify-center p-5 bg-gray-100 rounded-2xl w-[400px]">
            <div className="flex items-center space-x-2">
              <div className="tossface text-2xl">🤖</div>
              <div className="text-gray-500">이렇게 해보면 어떨까요?</div>
            </div>
            <div className="text-base mt-3">{message}</div>
            <div onClick={handleRetry} className="underline text-gray-500 mt-3 cursor-pointer">
              처음으로 돌아가기
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
