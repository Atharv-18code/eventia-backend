export const isValidDate = (date: any): boolean => {
    return !isNaN(new Date(date).getTime());
};