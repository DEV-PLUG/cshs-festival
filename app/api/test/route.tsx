import { NextResponse } from "next/server";
import { GoogleGenAI, } from "@google/genai";

 
 export const POST = async function PostHandler(request:Request) {
  const ai = new GoogleGenAI({ apiKey: "YAIzaSyCpYIW4xP3f2yNzzd8lACYuJBIssLYnbkE" });
  const req = await request.json();
  const blob = req.video
  const contents = [
    {
      inlineData: {
        mimeType: "video/mov",
        data: blob,
      },
    },
    { text: "You are helpful balling advice AI assistant. After watching this balling video, give appropriate advice for improvement. You must use a friendly tone. You must response in Korean." }
  ];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-04-17",
    contents: contents,
  });
  return NextResponse.json({
    success: false,
    message: response.text
  }, { status: 404 });
}
