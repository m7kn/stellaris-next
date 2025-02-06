import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';

const db = new Database('translations.db', { verbose: console.log });

export async function GET(request: Request) {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const pageSize = parseInt(searchParams.get('pageSize') || '50');
      const searchTerm = searchParams.get('search') || '';
      const offset = (page - 1) * pageSize;
  
      // Összes találat számának lekérése
      const totalCount = db.prepare(`
        SELECT COUNT(*) as count
        FROM translations t
        LEFT JOIN files f ON t.file_id = f.id
        WHERE 
          LOWER(t.english_text) LIKE LOWER(?) OR
          LOWER(t.temp_hungarian) LIKE LOWER(?) OR
          LOWER(t.final_hungarian) LIKE LOWER(?) OR
          LOWER(f.filename) LIKE LOWER(?) OR
          LOWER(t.key) LIKE LOWER(?)
      `).get(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`) as { count: number };
  
      // Aktuális oldal adatainak lekérése
      const translations = db.prepare(`
        SELECT 
          t.id, t.line_number, t.line_type, t.key, t.english_text, 
          t.temp_hungarian, t.final_hungarian, t.is_translated,
          t.created_at, t.modified_at,
          f.filename
        FROM translations t
        LEFT JOIN files f ON t.file_id = f.id
        WHERE 
          LOWER(t.english_text) LIKE LOWER(?) OR
          LOWER(t.temp_hungarian) LIKE LOWER(?) OR
          LOWER(t.final_hungarian) LIKE LOWER(?) OR
          LOWER(f.filename) LIKE LOWER(?) OR
          LOWER(t.key) LIKE LOWER(?)
        ORDER BY t.file_id, t.line_number
        LIMIT ? OFFSET ?
      `).all(
        `%${searchTerm}%`, 
        `%${searchTerm}%`, 
        `%${searchTerm}%`, 
        `%${searchTerm}%`, 
        `%${searchTerm}%`,
        pageSize, 
        offset
      );
      
      return NextResponse.json({
        data: translations,
        total: totalCount.count,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount.count / pageSize)
      });
    } catch (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch translations' },
        { status: 500 }
      );
    }
  }

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (data.action === 'updateTranslation') {
      const updateStmt = db.prepare(`
        UPDATE translations 
        SET temp_hungarian = ?, modified_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      updateStmt.run(data.temp_hungarian, data.id);
    } 
    else if (data.action === 'finalize') {
      const finalizeStmt = db.prepare(`
        UPDATE translations 
        SET final_hungarian = temp_hungarian,
            is_translated = 1,
            modified_at = CURRENT_TIMESTAMP
        WHERE id = ? AND is_translated = 0
      `);
      
      if (Array.isArray(data.ids)) {
        const transaction = db.transaction((ids) => {
          for (const id of ids) {
            finalizeStmt.run(id);
          }
        });
        transaction(data.ids);
      } else {
        finalizeStmt.run(data.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to update translation' },
      { status: 500 }
    );
  }
}