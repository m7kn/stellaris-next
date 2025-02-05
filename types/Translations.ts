export type Translations = {
    id: number;
    filename: string;
    line_number: number;
    line_type: string;
    key: string | null;
    english_text: string;
    temp_hungarian: string | null;
    final_hungarian: string | null;
    is_translated: boolean;
    created_at: string;
    modified_at: string;
}