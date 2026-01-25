export interface DossierItem {
  id?: string;
  code?: string;
  applicant?: {
    data?: {
      noidungyeucaugiaiquyet?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  accepter?: {
    fullname?: string;
    [key: string]: any;
  };
  appointmentDate?: string;
  procedure?: {
    id?: string;
    [key: string]: any;
  };
  currentTask?: any;
  [key: string]: any;
}

export interface MinistryData {
  dangXuLy: DossierItem[];
  gap: DossierItem[];
}

export interface FetchResult {
  boXayDung: MinistryData;
  boYTe: MinistryData;
  error?: string;
  unauthorized?: boolean;
  networkError?: boolean;
}
