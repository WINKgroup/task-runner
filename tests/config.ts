import mongoose, { Connection } from 'mongoose';
import fs from 'fs';

export default class TestConfig {
    dbUri: string;
    conn: Connection;

    constructor() {
        const configStr = fs.readFileSync('tests/config.json', 'utf-8');
        const config = JSON.parse(configStr);
        this.dbUri = config.dbUri;
        this.conn = mongoose.createConnection(this.dbUri);
    }

    async dropDbAndClose() {
        await this.conn.dropDatabase();
        await this.conn.close();
    }
}
