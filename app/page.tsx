'use client';
import { stat } from "fs";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const videoChunks = useRef<Blob[]>([]);

  const getMediaPermission = useCallback(async () => {
    try {
      const audioConstraints = { audio: true };
      const videoConstraints = {
        audio: false,
        video: true,
      };

      const audioStream = await navigator.mediaDevices.getUserMedia(
          audioConstraints
      );
      const videoStream = await navigator.mediaDevices.getUserMedia(
          videoConstraints
      );

      if (videoRef.current) {
          videoRef.current.srcObject = videoStream;
      }

      // MediaRecorder 추가
      const combinedStream = new MediaStream([
          ...videoStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ]);

      const recorder = new MediaRecorder(combinedStream, {
          mimeType: 'video/webm',
      });

      recorder.ondataavailable = (e) => {
          if (typeof e.data === 'undefined') return;
        if (e.data.size === 0) return;
        videoChunks.current.push(e.data);
      };

      mediaRecorder.current = recorder;
    } catch (err) {
      console.log(err);
    }
  }, []);

  useEffect(() => {
    getMediaPermission();
  }, []);

  const downloadVideo = () => {
    const videoBlob = new Blob(videoChunks.current, { type: 'video/webm' });
    const videoUrl = URL.createObjectURL(videoBlob);
    const link = document.createElement('a');
    link.download = `My video.webm`;
    link.href = videoUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [recordState, setRecordState] = useState(false);
  const [state, setState] = useState(0);

  async function handleVideo() {
    if(state === 1) {
      const videoBlob = new Blob(videoChunks.current, { type: mediaRecorder.current?.mimeType || 'video/webm' });
      console.log(videoBlob)
      const formData = new FormData();
      formData.append('video', videoBlob);

      const filereader = new FileReader();
      let base64data = "";
      filereader.readAsDataURL(videoBlob);
      filereader.onload = function() {
        base64data = filereader.result as string;
        console.log(base64data);
      };

      await fetch('/api/test', {
        method: 'POST',
        body: JSON.stringify({
          video: base64data,
          type: mediaRecorder.current?.mimeType || 'video/webm',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => {
        console.log(data);
      });

      setTimeout(() => {
        setState(2);
      }, 1500);
    }
    if(state === 0) {
      getMediaPermission();
    }
  }
  useEffect(() => {
    handleVideo();
  }, [state]);

  return (
    <div>
      { state === 0 && <div className="fixed top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-[800px]">
        <div className="flex justify-between items-end mb-5">
          <div>
            <div className="text-lg">제 9회 과학창의체험전 - 키이스트(정보)</div>
            <div className="text-2xl font-bold">AI로 배우는 볼링</div>
          </div>
          { recordState && <div className="flex items-center space-x-1 animate-pulse">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="text-red-500">녹화중</div>
          </div> }
        </div>
        <video className="h-[494px] w-[800px] object-cover object-center rounded-3xl" ref={videoRef} autoPlay />
        <div className="flex items-center justify-center mt-5 spaxe-x-5">
          <div onClick={() => {
            if(recordState) {
              mediaRecorder.current?.stop();
              setRecordState(false);
            }
            else {
              mediaRecorder.current?.start();
              setRecordState(true);
            }
          }} className={ recordState ? "px-16 py-4 rounded-2xl bg-gray-100 text-gray-500 text-center cursor-pointer hover:bg-gray-200 transition-colors" : "px-16 py-4 rounded-2xl bg-red-100 text-red-500 text-center cursor-pointer hover:bg-red-200 transition-colors" }>
            {recordState ? '녹화 중지' : '녹화 시작'}
          </div>
          <div className="mr-3"></div>
          <div onClick={() => {
            setState(1);
          }} className={ recordState ? "px-16 py-4 rounded-2xl bg-blue-100 text-blue-500 text-center opacity-50 transition-colors" : "px-16 py-4 rounded-2xl bg-blue-100 text-blue-500 text-center cursor-pointer hover:bg-blue-200 transition-colors" }>
            결과 확인
          </div>
          {/* <button onClick={downloadVideo}>Download</button> */}
        </div>
      </div> }
      { state === 1 && <div className="fixed top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 items-center justify-center">
        <div className="tossface text-[10rem] animate-bounce text-center">🤖</div>
        <div className="text-3xl font-bold text-center">AI가 영상을 살펴보고 있어요</div>
        <div className="text-lg text-center mt-1">잠시 기다리면 볼링을 더 잘 칠 수 있는 방법을 알려드릴게요</div>
      </div> }
      { state === 2 && <div className="fixed top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 items-center justify-center p-5 bg-gray-100 rounded-2xl w-[400px]">
        <div className="flex items-center space-x-2">
          <div className="tossface text-2xl">🤖</div>
          <div className="text-gray-500">이렇게 해보면 어떨까요?</div>
        </div>
        <div className="text-base mt-3">공을 조금 더 늦게 놓아보세요. 너무 빨리 놓아 공이 위로 뜨면서 앞으로 가는 힘을 잘 받지 못하는 것 같아요. 또, 발 위치를 조금 더 조정해보고 나에게 맞는 위치를 잘 찾아보면 볼링 실력을 높일 수 있을거에요!</div>
        <div onClick={() => setState(0)} className="underline text-gray-500 mt-3 cursor-pointer">처음으로 돌아가기</div>
      </div> }
    </div>
  );
}
