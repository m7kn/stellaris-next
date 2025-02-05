import { Translations } from './Translations';

export type TableData = {
    data: Translations[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
};