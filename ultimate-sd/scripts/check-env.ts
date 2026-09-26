import fs from 'fs';
import path from 'path';

const requiredEnvVars = [
    'DATABASE_URL',
    'AUTH_SECRET',
];

const paymentEnvVars = [
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'NEXT_PUBLIC_RAZORPAY_KEY_ID',
    'RAZORPAY_WEBHOOK_SECRET',
];

const emailEnvVars = [
    'RESEND_API_KEY',
    'EMAIL_FROM',
    'NEXT_PUBLIC_APP_URL',
];

const cloudinaryEnvVars = [
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
];

const upstashEnvVars = [
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
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
    const missingPayment = paymentEnvVars.filter(key => !loadedEnv[key]);
    const missingEmail = emailEnvVars.filter(key => !loadedEnv[key]);
    const missingCloudinary = cloudinaryEnvVars.filter(key => !loadedEnv[key]);
    const missingUpstash = upstashEnvVars.filter(key => !loadedEnv[key]);

    if (missing.length > 0) {
        console.warn('⚠️  Missing environment variables (functionality may be limited):');
        missing.forEach(key => console.warn(`   - ${key}`));

        if (missing.includes('DATABASE_URL')) {
            process.exit(1);
        }
    }

    if (missingPayment.length > 0) {
        console.warn('⚠️  Payment env vars missing (checkout disabled until set):');
        missingPayment.forEach(key => console.warn(`   - ${key}`));
    }

    if (missingEmail.length > 0) {
        console.warn('⚠️  Email env vars missing (Resend auth emails disabled):');
        missingEmail.forEach(key => console.warn(`   - ${key}`));
    }

    if (missingCloudinary.length > 0) {
        console.warn('⚠️  Cloudinary env vars missing (blog image uploads disabled until set):');
        missingCloudinary.forEach(key => console.warn(`   - ${key}`));
    }

    if (missingUpstash.length > 0) {
        console.warn('⚠️  Upstash env vars missing (Rate limiting disabled):');
        missingUpstash.forEach(key => console.warn(`   - ${key}`));
    }

    console.log('✅ All required environment variables are set.');
};

main();
