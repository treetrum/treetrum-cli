import { Stats } from "fs";
import fs from "fs/promises";
import path from "path";

const getInDirectory =
    (predicate: (stat: Stats) => boolean) =>
    async (directoryPath: string): Promise<string[]> => {
        const items = await fs.readdir(directoryPath);
        const itemsToReturn = [];
        for (const item of items) {
            const fullPath = path.join(directoryPath, item);
            const stat = await fs.stat(fullPath);
            if (predicate(stat)) {
                itemsToReturn.push(item);
            }
        }
        return itemsToReturn;
    };

export const getFoldersInDirectory = getInDirectory((stat) => stat.isDirectory());

export const getFilesInDirectory = getInDirectory((stat) => stat.isFile());
