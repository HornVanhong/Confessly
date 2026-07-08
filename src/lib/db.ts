import mysql from 'mysql2/promise';

// Establish a global connection pool. Node.js processes reuse this pool across requests.
// Setting connectionLimit to 2 prevents Serverless database connection exhaustion.
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 8889,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_DATABASE || 'confessly',
  waitForConnections: true,
  connectionLimit: 2,
  queueLimit: 0,
});

let initialized = false;

const initDb = async () => {
  if (initialized) return;

  // Create confessions table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS confessions (
      id VARCHAR(255) PRIMARY KEY,
      content TEXT NOT NULL,
      category VARCHAR(50) NOT NULL,
      nickname VARCHAR(50) NOT NULL,
      isPublic TINYINT(1) NOT NULL DEFAULT 1,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      createdAt VARCHAR(50) NOT NULL,
      reportsCount INT NOT NULL DEFAULT 0,
      image LONGTEXT NULL,
      facebookPostId VARCHAR(255) NULL,
      reactions_hug INT NOT NULL DEFAULT 0,
      reactions_heart INT NOT NULL DEFAULT 0,
      reactions_sad INT NOT NULL DEFAULT 0,
      reactions_laugh INT NOT NULL DEFAULT 0,
      reactions_shocked INT NOT NULL DEFAULT 0
    )
  `);

  // Create comments table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id VARCHAR(255) PRIMARY KEY,
      confessionId VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      nickname VARCHAR(50) NOT NULL,
      createdAt VARCHAR(50) NOT NULL,
      FOREIGN KEY (confessionId) REFERENCES confessions(id) ON DELETE CASCADE
    )
  `);

  // Insert seed data if confessions table is empty
  const [rows] = await pool.query('SELECT COUNT(*) as count FROM confessions');
  const count = (rows as mysql.RowDataPacket[])[0]?.count as number || 0;
  
  if (count === 0) {
    const initialConfessions = [
      {
        id: 'confession-1',
        content: "I've been in love with my best friend for 4 years. She is getting married next month, and I'm her maid of honor. I will take this secret to my grave because her happiness means everything to me.",
        category: 'Love',
        nickname: 'AnonymousMaid',
        isPublic: 1,
        status: 'approved',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        reactions_hug: 42,
        reactions_heart: 89,
        reactions_sad: 15,
        reactions_laugh: 0,
        reactions_shocked: 4,
      },
      {
        id: 'confession-2',
        content: "I told my parents I was staying late at the library to study for finals, but I actually went to a concert of a band they forbid me from listening to. I got the highest grade in the class anyway!",
        category: 'School',
        nickname: 'RebelA+',
        isPublic: 1,
        status: 'approved',
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
        reactions_hug: 5,
        reactions_heart: 12,
        reactions_sad: 0,
        reactions_laugh: 58,
        reactions_shocked: 10,
      },
      {
        id: 'confession-3',
        content: "I accidentally ate my roommate's expensive leftover sushi and blamed it on the neighbor's outdoor cat that somehow 'slipped in'. I even left a window slightly open to make it believable. I feel horrible but I'm too deep in the lie now.",
        category: 'Funny',
        nickname: 'SushiThief',
        isPublic: 1,
        status: 'approved',
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        reactions_hug: 8,
        reactions_heart: 2,
        reactions_sad: 4,
        reactions_laugh: 94,
        reactions_shocked: 25,
      }
    ];

    for (const c of initialConfessions) {
      await pool.query(
        `INSERT INTO confessions 
         (id, content, category, nickname, isPublic, status, createdAt, reactions_hug, reactions_heart, reactions_sad, reactions_laugh, reactions_shocked) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [c.id, c.content, c.category, c.nickname, c.isPublic, c.status, c.createdAt, c.reactions_hug, c.reactions_heart, c.reactions_sad, c.reactions_laugh, c.reactions_shocked]
      );
    }
  }

  initialized = true;
};

export async function dbQuery(sql: string, params?: unknown[]) {
  await initDb();
  const [results] = await pool.query(sql, params);
  return results;
}
