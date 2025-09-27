import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


// lib/query-utils.ts

/**
 * 将对象转换为 URL query string
 * @param params - 参数对象
 * @param options - 配置选项
 * @returns 格式化的 query string (包含 ? 前缀)
 */
export function buildQueryString(
  params: Record<string, unknown>,
  options: {
    encode?: boolean; // 是否进行 URL 编码 (默认 true)
    includeQuestionMark?: boolean; // 是否包含 ? 前缀 (默认 true)
    filterEmpty?: boolean; // 是否过滤空值 (默认 true)
  } = {}
): string {
  const {
    encode = true,
    includeQuestionMark = true,
    filterEmpty = true
  } = options;

  // 过滤掉 null、undefined、空字符串
  const filteredParams = filterEmpty 
    ? Object.fromEntries(
        Object.entries(params).filter(([_, value]) => {
          if (value === null || value === undefined) return false;
          if (value === '') return false;
          if (Array.isArray(value) && value.length === 0) return false;
          return true;
        })
      )
    : params;

  const queryEntries = Object.entries(filteredParams);
  
  if (queryEntries.length === 0) {
    return '';
  }

  const queryString = queryEntries
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        // 处理数组参数: key[]=value1&key[]=value2
        return value
          .map(item => `${encode ? encodeURIComponent(key + '[]') : key + '[]'}=${encode ? encodeURIComponent(String(item)) : String(item)}`)
          .join('&');
      }
      
      // 处理普通参数
      return `${encode ? encodeURIComponent(key) : key}=${encode ? encodeURIComponent(String(value)) : String(value)}`;
    })
    .join('&');

  return includeQuestionMark ? `?${queryString}` : queryString;
}


// lib/next-query-utils.ts
import { NextRequest } from 'next/server';
import { ReadonlyURLSearchParams } from 'next/navigation';

/**
 * 从 NextRequest 构建 query string
 */
export function buildQueryStringFromRequest(
  request: NextRequest,
  options: {
    mergeParams?: Record<string, unknown>; // 合并额外参数
    excludeParams?: string[]; // 排除的参数
  } = {}
): string {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  return buildQueryStringFromSearchParams(searchParams, options);
}

/**
 * 从 URLSearchParams 构建 query string
 */
export function buildQueryStringFromSearchParams(
  searchParams: URLSearchParams | ReadonlyURLSearchParams,
  options: {
    mergeParams?: Record<string, unknown>;
    excludeParams?: string[];
  } = {}
): string {
  const params: Record<string, unknown> = {};
  
  // 转换 URLSearchParams 为对象
  searchParams.forEach((value, key) => {
    if (options.excludeParams?.includes(key)) {
      return;
    }
    
    // 处理重复的 key（数组参数）
    if (key in params) {
      if (Array.isArray(params[key])) {
        params[key].push(value);
      } else {
        params[key] = [params[key], value];
      }
    } else {
      params[key] = value;
    }
  });
  
  // 合并额外参数
  if (options.mergeParams) {
    Object.assign(params, options.mergeParams);
  }
  
  return buildQueryString(params);
}