export type ErrorResponse = {
    statusCode?: number;
    timestamp: string;
    path: string;
    error?: any;
};