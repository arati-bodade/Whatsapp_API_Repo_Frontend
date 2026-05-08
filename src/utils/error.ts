
export const getErrorMessage = (error: any): string => {
    if (!error) return "Unknown error occurred";

    // Handle Axios error response
    if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === "string") return detail;
        if (Array.isArray(detail)) {
            // Pydantic validation error array
            return detail.map((err: any) => err.msg || JSON.stringify(err)).join(", ");
        }
        if (typeof detail === "object") return JSON.stringify(detail);
    }

    // Handle generic error message
    if (error.message) return error.message;

    // Fallback
    return "An unexpected error occurred";
};
