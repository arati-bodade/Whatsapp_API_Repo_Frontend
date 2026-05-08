export interface SubBusinessUser {
    id: string;
    name: string;
    plan: string;
    status: string;
}

export interface ResellerAnalytics {
    id: string;
    name: string;
    email: string;
    plan: string;
    credits: number;
    businesses: number;
    subUsers: SubBusinessUser[];
    expiry: string | null;
    status: string;
}

export interface DirectBusinessUser {
    id: string;
    name: string;
    email: string;
    plan: string;
    expiry: string | null;
    status: string;
}

export interface AnalyticsStats {
    totalResellers: number;
    totalSubBusinesses: number;
    totalDirectBusinesses: number;
    totalCredits: number;
    totalThroughput: number;
}

export type LifecycleAlertType = 'Expiring' | 'Critical';

export interface LifecycleAlert {
    name: string;
    plan: string;
    expiry: string;
    type: LifecycleAlertType;
}

export interface AnalyticsResponse {
    resellers: ResellerAnalytics[];
    directBusinessUsers: DirectBusinessUser[];
    stats: AnalyticsStats;
    lifecycleAlerts: LifecycleAlert[];
}
