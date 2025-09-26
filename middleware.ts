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
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
        'Access-Control-Allow-Headers': '*',
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

    // 构建转发请求的 headers
    const headers = new Headers();
    
    // 复制除 host 外的所有 headers
    request.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'host') {
        headers.set(key, value);
      }
    });
    
    // 设置正确的 host
    headers.set('host', targetUrl.host);
    
    // 添加必要的头信息避免 403
    headers.set('Referer', targetUrl.origin);
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // 如果目标服务器需要特定的认证头
    if (!headers.has('Origin')) {
      headers.set('Origin', targetUrl.origin);
    }

    // 转发请求
    const fetchOptions: RequestInit = {
      method: request.method,
      headers: headers,
      redirect: 'follow', // 跟随重定向
    };

    if (body) {
      fetchOptions.body = body;
    }

    const response = await fetch(targetUrl.toString(), fetchOptions);

    // 如果还是 403，尝试不使用某些头信息
    if (response.status === 403) {
      console.log('第一次请求返回 403，尝试简化头信息...');
      
      // 简化头信息重新尝试
      const simpleHeaders = new Headers();
      simpleHeaders.set('Content-Type', headers.get('Content-Type') || 'application/json');
      simpleHeaders.set('Accept', 'application/json, */*');
      
      const retryResponse = await fetch(targetUrl.toString(), {
        ...fetchOptions,
        headers: simpleHeaders,
      });
      
      if (retryResponse.ok) {
        return createResponse(retryResponse);
      }
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

// 创建响应的辅助函数
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