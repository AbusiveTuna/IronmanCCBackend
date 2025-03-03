import { templeMap } from '../../../resources/2024_templeMap.js';

export const getTempleSkills = () => {
    return templeMap.map(row => row[row.length - 1]);
};