import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { proxy } = req.query;
  const path = Array.isArray(proxy) ? proxy.join('/') : proxy || '';
  
  // 目标网站
  const targetUrl = `https://artsharing.vhost.chengzhanheng.cn/${path}`;
  
  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        host: 'artsharing.vhost.chengzhanheng.cn', // 修改 host 头
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    // 转发响应
    const data = await response.text();
    
    // 设置响应头
    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    res.send(data);
  } catch (error) {
    res.status(500).json({ error: '代理请求失败' });
  }
}