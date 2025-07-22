export type ApiResponse<T> = {
    timestamp: number;
    success: boolean;
    data: T;
    message: string;
    error: string;
};

export type Event = {
    id: string;
    title: string;
    description: string;
    category: string;
    date: Date;
    isPublic: boolean;
    image: string;
    organizerId: string;
    venueId: string | null;
    createdAt: Date;
    updatedAt: Date;
};