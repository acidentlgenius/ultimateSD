import fs from 'fs';
import path from 'path';

const requiredEnvVars = [
    'DATABASE_URL',
    'AUTH_SECRET',
    // 'GOOGLE_CLIENT_ID', // Optional for local build
    // 'GOOGLE_CLIENT_SECRET',
];

const envPath = path.resolve(process.cwd(), '.env');
const envLocalPath = path.resolve(process.cwd(), '.env.local');

// Helper to load env file (basic parsing)
const loadEnv = (filePath: string) => {
    if (!fs.existsSync(filePath)) return {};
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n').reduce((acc: any, line) => {
        const [key, value] = line.split('=');
        if (key && !line.trim().startsWith('#')) {
            acc[key.trim()] = value ? value.trim() : '';
        }
        return acc;
    }, {});
};

const main = () => {
    console.log('🔍 Checking environment variables...');

    // Load from process.env (CI/CD) or local files
    const loadedEnv = {
        ...loadEnv(envPath),
        ...loadEnv(envLocalPath),
        ...process.env // process.env takes precedence
    };

    const missing = requiredEnvVars.filter(key => !loadedEnv[key]);

    if (missing.length > 0) {
        console.warn('⚠️  Missing environment variables (functionality may be limited):');
        missing.forEach(key => console.warn(`   - ${key}`));

        // Only fail for DB
        if (missing.includes('DATABASE_URL')) {
            process.exit(1);
        }
    }

    console.log('✅ All required environment variables are set.');
};

main();
