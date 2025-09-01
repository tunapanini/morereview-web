// 타입 정의만 유지 - 클라이언트 사이드에서 Supabase 사용 제거
export interface Region {
  code: string;
  name: string;
  subRegions: SubRegion[];
}

export interface SubRegion {
  code: string;
  name: string;
  parentCode: string;
}