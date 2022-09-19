import stringify from "csv-stringify/lib/sync";

export const dataArrayToCSVString = (data: Record<string, any>[]) => {
    return stringify(data, { header: true });
};
