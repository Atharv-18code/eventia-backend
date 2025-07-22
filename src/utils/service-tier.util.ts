const SERVICE_TIERS = {
    catering: { none: 0, standard: 100, premium: 200 },
    decoration: { none: 0, standard: 50, premium: 150 },
    photography: { none: 0, standard: 75, premium: 175 },
    music: { none: 0, standard: 60, premium: 120 }
};

export const mapServiceToValue = (service: string, type: keyof typeof SERVICE_TIERS): number => {
    return SERVICE_TIERS[type][service.toLowerCase() as keyof typeof SERVICE_TIERS[typeof type]] || 0;
};