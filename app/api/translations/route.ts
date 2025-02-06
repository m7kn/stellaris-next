import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';

const db = new Database('translations.db', { verbose: console.log });

export async function GET(request: Request) {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const pageSize = parseInt(searchParams.get('pageSize') || '50');
      const offset = (page - 1) * pageSize;

      // Gyűjtsük ki a szűrőket
      const filters: { [key: string]: string } = {};
      const validColumns = ['id', 'filename', 'key', 'english_text', 'temp_hungarian', 'final_hungarian', 'is_translated'];
      
      validColumns.forEach(column => {
        const value = searchParams.get(column);
        if (value !== null && value !== '') {
          filters[column] = value;
        }
      });

      // SQL WHERE feltételek és paraméterek építése
      let whereConditions: string[] = [];
      let parameters: any[] = [];

      Object.entries(filters).forEach(([column, value]) => {
        if (column === 'is_translated') {
          // Boolean érték kezelése
          whereConditions.push(`t.is_translated = ?`);
          parameters.push(value === 'true' ? 1 : 0);
        } else if (column === 'filename') {
          // Fájlnév kezelése (files táblából)
          whereConditions.push(`LOWER(f.filename) LIKE LOWER(?)`);
          parameters.push(`%${value}%`);
        } else {
          // Minden más mező kezelése
          whereConditions.push(`LOWER(t.${column}) LIKE LOWER(?)`);
          parameters.push(`%${value}%`);
        }
      });

      // Alap WHERE feltétel, ha nincs szűrő
      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}` 
        : '';

      // Összes találat számának lekérése
      const countQuery = `
        SELECT COUNT(*) as count
        FROM translations t
        LEFT JOIN files f ON t.file_id = f.id
        ${whereClause}
      `;
      
      const totalCount = db.prepare(countQuery).get(...parameters) as { count: number };

      // Aktuális oldal adatainak lekérése
      const dataQuery = `
        SELECT 
          t.id, t.line_number, t.line_type, t.key, t.english_text, 
          t.temp_hungarian, t.final_hungarian, t.is_translated,
          t.created_at, t.modified_at,
          f.filename
        FROM translations t
        LEFT JOIN files f ON t.file_id = f.id
        ${whereClause}
        ORDER BY t.file_id, t.line_number
        LIMIT ? OFFSET ?
      `;

      // Paraméterek kiegészítése a LIMIT és OFFSET értékekkel
      const queryParams = [...parameters, pageSize, offset];
      const translations = db.prepare(dataQuery).all(...queryParams);
      
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