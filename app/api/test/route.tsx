import { NextResponse } from "next/server";
import {
  GoogleGenAI,
  createUserContent,
  createPartFromBase64
 } from "@google/genai";
import formidable from "formidable";
import fs from "fs"
 
export const POST = async function PostHandler(request:Request) {
  const ai = new GoogleGenAI({ apiKey: "AIzaSyBNtBw7IYI4Gi4b3nF4AEx8vJBcQkKJLfc" });

  console.log(request)
  const data = await request.formData();
  console.log(data)
  const videoBlob = data.get("video") as File
  const videoBuffer = Buffer.from(await videoBlob.arrayBuffer());
  console.log(videoBlob)
  const video = videoBuffer.toString("base64")
  console.log(video)
  const type = "video/webm"

  // 왜 함수가 비동기고 지랄이야
  // let video
  // fs.readFile("public/WIN_20250512_16_01_57_Pro.mp4", (err, data) => {
  //   console.log("It works!!!!!")
  //   if (err) {
  //     console.log("----------")
  //     console.log(err)
  //     console.log("----------")
  //     return
  //   }
  //   video =  data
  // })
  
  // const video = fs.readFileSync("public/WIN_20250512_19_33_52_Pro.mp4", {encoding: "base64"})
  // const type = "video/mp4"
  
  const contents =  createPartFromBase64(video, type)
  console.log(contents)

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-04-17",
    contents: contents,
    config: {
      systemInstruction: "\
- You are helpful bowling advice AI assistant.\n\
- After watching this balling video, give appropriate advice for improvement.\n\
- Do not include text that you see video well.\n\
- You must use a friendly tone.\n\
- You must answer in Korean.\n\
- You must give detailed advice.\n\
- You cannot use difiicult term.\n\
- You must not use Markdown syntax at response.\n\
- You cannot include any phrases in response which are not related to bowling.\n\
- If user achieves a strike, just praise them.\n\
- Respone must about 200 characters."
    }
  });
  console.log(response.text)
  return NextResponse.json({
    success: false,
    message: response.text
  }, { status: 200 });
}
