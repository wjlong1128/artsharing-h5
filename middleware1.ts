import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/h5-api')) {
    return NextResponse.next();
  }

  // 处理 OPTIONS 预检请求
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin':'*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
        'Access-Control-Allow-Headers':'*',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // 构建目标 URL
  const pathname = request.nextUrl.pathname.replace('/h5-api', '') || '/';
  const targetUrl = new URL(`https://artsharing.vhost.chengzhanheng.cn${pathname}`);
  
  // 保留查询参数
  request.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  try {
    // 获取请求体数据
    let body = null;
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      const clonedRequest = request.clone();
      body = await clonedRequest.text();
    }

    // 直接使用优化后的头信息（避免重复尝试）
    const headers = new Headers();
    
    // 必需的头信息
    headers.set('Host', targetUrl.host);
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    headers.set('Accept', 'application/json, */*');
    
    // 保持原有的 Content-Type
    const contentType = request.headers.get('Content-Type') || 'application/json';
    headers.set('Content-Type', contentType);
    
    // 添加 Referer 和 Origin（某些服务器需要）
    headers.set('Referer', targetUrl.origin);
    headers.set('Origin', targetUrl.origin);

    // 复制其他可能需要的头信息（如认证信息）
    const importantHeaders = ['Authorization', 'X-API-Key', 'X-Requested-With', 'Cookie'];
    importantHeaders.forEach(header => {
      const value = request.headers.get(header);
      if (value) {
        headers.set(header, value);
      }
    });

    console.log('转发请求:', {
      method: request.method,
      url: targetUrl.toString(),
      headers: Object.fromEntries(headers.entries()),
      hasBody: !!body
    });

    const fetchOptions: RequestInit = {
      method: request.method,
      headers: headers,
      redirect: 'follow',
    };

    if (body) {
      fetchOptions.body = body;
    }

    const response = await fetch(targetUrl.toString(), fetchOptions);

    console.log('响应状态:', response.status, response.statusText);

    // 如果是403，提供更详细的错误信息
    if (response.status === 403) {
      const responseText = await response.text();
      console.error('403 错误详情:', responseText);
      
      return NextResponse.json(
        { 
          error: '目标服务器拒绝访问(403)',
          details: '可能是IP限制或认证问题',
          serverResponse: responseText.slice(0, 500) // 只返回前500字符
        },
        { status: 403 }
      );
    }

    return createResponse(response);

  } catch (error) {
    console.error('代理请求失败:', error);
    return NextResponse.json(
      { error: '代理请求失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

function createResponse(response: Response): NextResponse {
  const nextResponse = new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
  });

  // 复制响应头
  response.headers.forEach((value, key) => {
    nextResponse.headers.set(key, value);
  });

  // 设置 CORS 头
  nextResponse.headers.set('Access-Control-Allow-Origin', '*');
  nextResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  nextResponse.headers.set('Access-Control-Allow-Headers', '*');

  return nextResponse;
}

export const config = {
  matcher: '/h5-api/:path*',
};