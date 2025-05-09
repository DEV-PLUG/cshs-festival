import { NextResponse } from "next/server";
import { GoogleGenAI, } from "@google/genai";

 
export const POST = async function PostHandler(request:Request) {
  const ai = new GoogleGenAI({ apiKey: "AIzaSyBNtBw7IYI4Gi4b3nF4AEx8vJBcQkKJLfc" });
  const req = await request.json();
  const { video, type } = req;

  const contents = [
    {
      inlineData: {
        mimeType: type,
        data: video,
      },
    },
    { text: "You are helpful balling advice AI assistant. After watching this balling video, give appropriate advice for improvement. You must use a friendly tone. You must response in Korean." }
  ];
  
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: contents,
  });
  return NextResponse.json({
    success: false,
    message: response.text
  }, { status: 404 });
}
