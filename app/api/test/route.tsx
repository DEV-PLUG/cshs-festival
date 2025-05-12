import { NextResponse } from "next/server";
import {
  GoogleGenAI,
  createUserContent,
  createPartFromBase64
 } from "@google/genai";
import fs from "fs"
 
export const POST = async function PostHandler(request:Request) {
  const ai = new GoogleGenAI({ apiKey: "AIzaSyBNtBw7IYI4Gi4b3nF4AEx8vJBcQkKJLfc" });
  // const req = await request.json();
  // const { video, type } = req;

  let video
  fs.readFile("public/WIN_20250512_16_01_57_Pro.mp4", (err, data) => {
    if (err) {
      console.log("----------")
      console.log(err)
      console.log("----------")
      return
    }
    video = typeof(data)
  })
  const type = "video/mp4"
  console.log("?"+video+"?")
  // const contents = createUserContent([
  //   "You are helpful balling advice AI assistant. After watching this balling video, give appropriate advice for improvement. You must use a friendly tone. You must response in Korean.",
  //   createPartFromBase64(video, type)
  // ])
  const contents = [
    {
      inlineData: {
        mimeType: type,
        data: video
      },
    }
  ]
  console.log(contents)
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: contents,
    config: {
      systemInstruction: "You are helpful balling advice AI assistant. After watching this balling video, give appropriate advice for improvement. You must use a friendly tone. You must response in Korean."
    }
  });
  console.log(response.text)
  return NextResponse.json({
    success: false,
    message: response.text
  }, { status: 404 });
}
