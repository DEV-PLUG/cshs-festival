import { NextResponse } from "next/server";

export const GET = async function GetHandler() {
  return NextResponse.json({
    success: false,
    message: '사용자 정보를 찾을 수 없어요'
  }, { status: 404 });
}