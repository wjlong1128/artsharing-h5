import { buildQueryString } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

async function handler(request: NextRequest) {
    
  try {
    const body = await request.json();
    const res = await fetch(
      `https://artsharing.vhost.chengzhanheng.cn/api/index/getmenutowlist${buildQueryString(body)}`,
      {
        method: "POST",
        body: body
      }
    );
    const json = await res.json();
    return NextResponse.json(json);
  } catch (e) {
    console.log(e);
    return NextResponse.json({code: 500, message: "服务器错误"});
  }
}


export { handler as GET, handler as POST };