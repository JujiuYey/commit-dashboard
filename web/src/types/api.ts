// 统一响应结构
export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

// 分页响应结构
export interface PageData<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_page: number;
}
